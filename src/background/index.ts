import { Rule, EncryptedStore, ExtensionMessage, ExtensionResponse, FocusStats } from '../types';
import { encryptAndSignRules, verifyAndDecryptRules } from './security';
import { computeLockState, isRuleActive } from './scheduler';
import { findMatchingActiveRule, syncDnrRules } from './firewall';

import {
  ALARM_NAME,
  DEFAULT_RULES,
  DEFAULT_STATS,
  PROD_UNINSTALL_BASE_URL,
  LOCAL_UNINSTALL_BASE_URL,
} from '../constants';

const getUninstallBaseUrl = (): string => {
  if (typeof chrome !== 'undefined' && chrome.runtime?.getManifest) {
    const manifest = chrome.runtime.getManifest();
    // Unpacked extensions in local dev don't have update_url
    const isUnpacked = !('update_url' in manifest);
    if (isUnpacked) {
      return LOCAL_UNINSTALL_BASE_URL;
    }
  }
  return PROD_UNINSTALL_BASE_URL;
};

const buildUninstallURL = (stats: FocusStats, baseUrl = getUninstallBaseUrl()): string => {
  const days = Math.max(1, Math.ceil((Date.now() - stats.firstInstalledAt) / (1000 * 60 * 60 * 24)));
  const params = new URLSearchParams({
    m: Math.max(0, stats.totalFocusMinutes).toString(),
    s: Math.max(0, stats.sessionsCompleted).toString(),
    b: Math.max(0, stats.blocksIntercepted).toString(),
    d: days.toString(),
  });
  return `${baseUrl}?${params.toString()}`;
};

const syncUninstallURL = async (stats: FocusStats): Promise<void> => {
  if (typeof chrome === 'undefined' || !chrome.runtime || typeof chrome.runtime.setUninstallURL !== 'function') {
    return;
  }
  try {
    const url = buildUninstallURL(stats);
    await chrome.runtime.setUninstallURL(url);
  } catch (err) {
    console.warn('[ServiceWorker] Could not set uninstall URL:', err);
  }
};

const loadStoredStats = async (): Promise<FocusStats> => {
  try {
    const data = await chrome.storage.local.get('focusStats');
    if (!data.focusStats) {
      const stats = { ...DEFAULT_STATS, firstInstalledAt: Date.now(), lastActiveAt: Date.now() };
      await chrome.storage.local.set({ focusStats: stats });
      return stats;
    }
    return data.focusStats;
  } catch (err) {
    console.error('[ServiceWorker] Failed to load focus stats:', err);
    return DEFAULT_STATS;
  }
};

const recordBlockInterception = async (): Promise<void> => {
  try {
    const stats = await loadStoredStats();
    stats.blocksIntercepted += 1;
    stats.lastActiveAt = Date.now();
    await chrome.storage.local.set({ focusStats: stats });
    await syncUninstallURL(stats);
  } catch (err) {
    console.error('[ServiceWorker] Failed to record block interception:', err);
  }
};

const recordFocusMinute = async (): Promise<void> => {
  try {
    const stats = await loadStoredStats();
    stats.totalFocusMinutes += 1;
    stats.lastActiveAt = Date.now();
    await chrome.storage.local.set({ focusStats: stats });
    await syncUninstallURL(stats);
  } catch (err) {
    console.error('[ServiceWorker] Failed to record focus minute:', err);
  }
};

const recordSessionCompleted = async (): Promise<void> => {
  try {
    const stats = await loadStoredStats();
    stats.sessionsCompleted += 1;
    stats.lastActiveAt = Date.now();
    await chrome.storage.local.set({ focusStats: stats });
    await syncUninstallURL(stats);
  } catch (err) {
    console.error('[ServiceWorker] Failed to record session completed:', err);
  }
};


/**
 * Load and decrypt rules from storage
 * Guaranteed to preserve saved user settings across extension updates
 */
const loadStoredRules = async (): Promise<{ rules: Rule[]; tamperDetected: boolean }> => {
  try {
    const data = await chrome.storage.local.get(['secureStore', 'rulesBackup']);
    
    // 1. If completely empty (first install ever), initialize defaults
    if (!data.secureStore && !data.rulesBackup) {
      const encrypted = await encryptAndSignRules(DEFAULT_RULES);
      await chrome.storage.local.set({ secureStore: encrypted, rulesBackup: DEFAULT_RULES });
      return { rules: DEFAULT_RULES, tamperDetected: false };
    }

    // 2. Normal case: decrypt existing secureStore
    if (data.secureStore) {
      const secureStore: EncryptedStore = data.secureStore;
      const result = await verifyAndDecryptRules(secureStore);
      if (!result.tamperDetected && result.rules.length > 0) {
        // Keep rulesBackup in sync with valid decrypted rules
        await chrome.storage.local.set({ rulesBackup: result.rules });
        return result;
      }
    }

    // 3. Fallback for extension updates:
    // If an update caused IndexedDB key desynchronization, restore previously saved rules from rulesBackup
    if (data.rulesBackup && Array.isArray(data.rulesBackup) && data.rulesBackup.length > 0) {
      console.log('[Security] Preserving previous rules across extension update');
      const reEncrypted = await encryptAndSignRules(data.rulesBackup);
      await chrome.storage.local.set({ secureStore: reEncrypted });
      return { rules: data.rulesBackup, tamperDetected: false };
    }

    return { rules: [], tamperDetected: true };
  } catch (err) {
    console.error('[ServiceWorker] Failed to load rules:', err);
    try {
      const fallback = await chrome.storage.local.get('rulesBackup');
      if (fallback.rulesBackup && Array.isArray(fallback.rulesBackup) && fallback.rulesBackup.length > 0) {
        return { rules: fallback.rulesBackup, tamperDetected: false };
      }
    } catch {
      // ignore
    }
    return { rules: [], tamperDetected: true };
  }
};

/**
 * Encrypt and persist rules and sync update backup
 */
const saveStoredRules = async (rules: Rule[]): Promise<void> => {
  const encrypted = await encryptAndSignRules(rules);
  await chrome.storage.local.set({ secureStore: encrypted, rulesBackup: rules });
};

/**
 * Updates extension action badge based on lock status
 */
const updateExtensionBadge = async (isLocked: boolean, tamperDetected: boolean): Promise<void> => {
  if (typeof chrome.action === 'undefined') return;

  if (tamperDetected) {
    await chrome.action.setBadgeText({ text: 'TAMPER' });
    await chrome.action.setBadgeBackgroundColor({ color: '#dc2626' });
  } else if (isLocked) {
    await chrome.action.setBadgeText({ text: 'LOCK' });
    await chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
  } else {
    await chrome.action.setBadgeText({ text: 'OFF' });
    await chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
  }
};

/**
 * Re-evaluate rules, update DNR, and refresh extension badge
 */
const refreshFirewallState = async (): Promise<void> => {
  const { rules, tamperDetected } = await loadStoredRules();
  const lockState = computeLockState(rules, tamperDetected);

  const activeRules = rules.filter((r) => isRuleActive(r));
  await syncDnrRules(activeRules);
  await updateExtensionBadge(lockState.isLocked, tamperDetected);
};

// -------------------------------------------------------------
// Lifecycle & Alarms
// -------------------------------------------------------------

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[TimeFocuser] Initialized, reason:', details?.reason);

  if (details?.reason === 'update') {
    console.log(
      `[TimeFocuser] Extension updated to version ${chrome.runtime.getManifest().version}. Retaining all saved settings, rules, and focus statistics.`
    );
  }

  const stats = await loadStoredStats();
  await syncUninstallURL(stats);
  await refreshFirewallState();

  // Create periodic alarm to check time schedules
  await chrome.alarms.create(ALARM_NAME, {
    periodInMinutes: 1,
  });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    const { rules, tamperDetected } = await loadStoredRules();
    const hasActiveRule = tamperDetected || rules.some((r) => isRuleActive(r));
    if (hasActiveRule) {
      await recordFocusMinute();
    }
    await refreshFirewallState();
  }
});

// -------------------------------------------------------------
// Real-time Navigation Interception (Firewall)
// -------------------------------------------------------------

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  // Only intercept top-level main frame navigations
  if (details.frameId !== 0) return;

  const { rules, tamperDetected } = await loadStoredRules();
  const activeRules = tamperDetected ? rules : rules.filter((r) => isRuleActive(r));

  const matched = findMatchingActiveRule(details.url, activeRules);
  if (matched) {
    await recordBlockInterception();

    const blockedUrl = chrome.runtime.getURL(
      `src/blocked/index.html?url=${encodeURIComponent(details.url)}&rule=${encodeURIComponent(
        matched.name
      )}&ruleId=${encodeURIComponent(matched.id)}`
    );

    // Immediately redirect the tab
    await chrome.tabs.update(details.tabId, { url: blockedUrl });
  }
});

// Fallback check on tab URL update
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'loading' || !tab.url) return;

  const { rules, tamperDetected } = await loadStoredRules();
  const activeRules = tamperDetected ? rules : rules.filter((r) => isRuleActive(r));

  const matched = findMatchingActiveRule(tab.url, activeRules);
  if (matched) {
    await recordBlockInterception();

    const blockedUrl = chrome.runtime.getURL(
      `src/blocked/index.html?url=${encodeURIComponent(tab.url)}&rule=${encodeURIComponent(
        matched.name
      )}&ruleId=${encodeURIComponent(matched.id)}`
    );
    await chrome.tabs.update(tabId, { url: blockedUrl });
  }
});

// -------------------------------------------------------------
// Message Handling & Anti-Tamper Lockdown Verification
// -------------------------------------------------------------

chrome.runtime.onMessage.addListener(
  (
    message: ExtensionMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: ExtensionResponse) => void
  ) => {
    (async () => {
      try {
        const { rules, tamperDetected } = await loadStoredRules();
        const lockState = computeLockState(rules, tamperDetected);

        switch (message.type) {
          case 'GET_STATE': {
            const stats = await loadStoredStats();
            sendResponse({
              success: true,
              data: {
                rules,
                lockState,
                tamperDetected,
                stats,
              },
            });
            return;
          }

          case 'GET_STATS': {
            const stats = await loadStoredStats();
            sendResponse({
              success: true,
              data: { stats },
            });
            return;
          }

          case 'RESET_STATS': {
            const stats: FocusStats = {
              ...DEFAULT_STATS,
              firstInstalledAt: Date.now(),
              lastActiveAt: Date.now(),
            };
            await chrome.storage.local.set({ focusStats: stats });
            await syncUninstallURL(stats);
            sendResponse({
              success: true,
              data: { stats },
            });
            return;
          }

          case 'CHECK_URL': {
            const activeRules = rules.filter((r) => isRuleActive(r));
            const matchedRule = findMatchingActiveRule(message.payload.url, activeRules);
            sendResponse({
              success: true,
              data: {
                isBlocked: !!matchedRule,
                matchedRule,
              },
            });
            return;
          }

          case 'START_TIMER': {
            await recordSessionCompleted();
            // Starting a focus timer is permitted even if unlocked, but immediately locks the system
            const { ruleId, durationMinutes } = message.payload;
            const updatedRules = rules.map((r) => {
              if (r.id === ruleId) {
                return {
                  ...r,
                  enabled: true,
                  scheduleType: 'timer' as const,
                  timerSchedule: {
                    durationMinutes,
                    expiresAt: Date.now() + durationMinutes * 60 * 1000,
                  },
                  updatedAt: Date.now(),
                };
              }
              return r;
            });

            await saveStoredRules(updatedRules);
            await refreshFirewallState();
            sendResponse({ success: true, data: { rules: updatedRules } });
            return;
          }

          // -----------------------------------------------------------
          // GRANULAR SECURITY LOCKOUT:
          // You can always add new rules.
          // But you CANNOT modify, disable, or delete rules that are currently blocking!
          // -----------------------------------------------------------
          case 'ADD_RULE': {
            const createdRule: Rule = {
              ...message.payload.rule,
              id: 'rule_' + crypto.randomUUID(),
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
            const newRules = [...rules, createdRule];
            await saveStoredRules(newRules);
            await refreshFirewallState();
            sendResponse({ success: true, data: { rules: newRules } });
            return;
          }

          case 'TOGGLE_RULE': {
            const targetRule = rules.find((r) => r.id === message.payload.ruleId);
            if (targetRule && isRuleActive(targetRule)) {
              console.warn(
                `[Security] Rejection: Rule "${targetRule.name}" is currently blocking and cannot be modified!`
              );
              sendResponse({
                success: false,
                error: `RULE_LOCKED: Rule "${targetRule.name}" is currently actively blocking and cannot be disabled or modified!`,
              });
              return;
            }

            const newRules = rules.map((r) =>
              r.id === message.payload.ruleId
                ? { ...r, enabled: message.payload.enabled, updatedAt: Date.now() }
                : r
            );
            await saveStoredRules(newRules);
            await refreshFirewallState();
            sendResponse({ success: true, data: { rules: newRules } });
            return;
          }

          case 'DELETE_RULE': {
            const targetRule = rules.find((r) => r.id === message.payload.ruleId);
            if (targetRule && isRuleActive(targetRule)) {
              console.warn(
                `[Security] Rejection: Rule "${targetRule.name}" is currently blocking and cannot be deleted!`
              );
              sendResponse({
                success: false,
                error: `RULE_LOCKED: Rule "${targetRule.name}" is currently actively blocking and cannot be deleted!`,
              });
              return;
            }

            const newRules = rules.filter((r) => r.id !== message.payload.ruleId);
            await saveStoredRules(newRules);
            await refreshFirewallState();
            sendResponse({ success: true, data: { rules: newRules } });
            return;
          }

          case 'UPDATE_RULE': {
            const targetRule = rules.find((r) => r.id === message.payload.rule.id);
            if (targetRule && isRuleActive(targetRule)) {
              sendResponse({
                success: false,
                error: `RULE_LOCKED: Rule "${targetRule.name}" is currently actively blocking and cannot be modified!`,
              });
              return;
            }

            const newRules = rules.map((r) =>
              r.id === message.payload.rule.id ? { ...message.payload.rule, updatedAt: Date.now() } : r
            );
            await saveStoredRules(newRules);
            await refreshFirewallState();
            sendResponse({ success: true, data: { rules: newRules } });
            return;
          }

          case 'SAVE_RULES': {
            // Ensure no actively blocking rule was deleted or disabled
            for (const r of rules) {
              if (isRuleActive(r)) {
                const updated = message.payload.rules.find((nr) => nr.id === r.id);
                if (!updated || !updated.enabled) {
                  sendResponse({
                    success: false,
                    error: `RULE_LOCKED: Cannot remove or disable actively blocking rule "${r.name}"!`,
                  });
                  return;
                }
              }
            }

            const newRules = message.payload.rules;
            await saveStoredRules(newRules);
            await refreshFirewallState();
            sendResponse({ success: true, data: { rules: newRules } });
            return;
          }

          default:
            sendResponse({ success: false, error: 'Unknown message type' });
        }
      } catch (err: any) {
        console.error('[ServiceWorker] Error handling message:', err);
        sendResponse({ success: false, error: err.message || 'Internal error' });
      }
    })();

    return true; // Keep message channel open for async response
  }
);
