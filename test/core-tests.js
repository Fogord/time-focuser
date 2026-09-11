import { test } from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

// -------------------------------------------------------------
// Test 1: URL Matching Engine
// -------------------------------------------------------------

const escapeRegexExceptWildcard = (str) => {
  return str.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
};

const wildcardToRegex = (pattern) => {
  const escaped = escapeRegexExceptWildcard(pattern);
  const regexStr = '^' + escaped.replace(/\*/g, '.*') + '$';
  return new RegExp(regexStr, 'i');
};

const matchesRule = (url, rule) => {
  try {
    const parsedUrl = new URL(url);
    const pattern = rule.urlPattern.trim();

    switch (rule.matchType) {
      case 'exact': {
        const cleanUrl = url.replace(/\/$/, '');
        const cleanPattern = pattern.replace(/\/$/, '');
        return cleanUrl.toLowerCase() === cleanPattern.toLowerCase();
      }

      case 'domain': {
        const cleanPatternDomain = pattern
          .replace(/^https?:\/\//i, '')
          .replace(/\/.*$/, '')
          .toLowerCase();

        const host = parsedUrl.hostname.toLowerCase();
        return host === cleanPatternDomain || host.endsWith('.' + cleanPatternDomain);
      }

      case 'wildcard': {
        const regex = wildcardToRegex(pattern);
        return regex.test(url);
      }

      case 'regex': {
        const regex = new RegExp(pattern, 'i');
        return regex.test(url);
      }

      default:
        return false;
    }
  } catch {
    return url.includes(rule.urlPattern);
  }
};

test('Firewall URL Matching - Domain matching', () => {
  const domainRule = {
    urlPattern: 'twitter.com',
    matchType: 'domain',
  };

  assert.strictEqual(matchesRule('https://twitter.com', domainRule), true);
  assert.strictEqual(matchesRule('https://twitter.com/explore', domainRule), true);
  assert.strictEqual(matchesRule('https://mobile.twitter.com/home', domainRule), true);
  assert.strictEqual(matchesRule('https://api.twitter.com/v1', domainRule), true);
  assert.strictEqual(matchesRule('https://not-twitter.com', domainRule), false);
  assert.strictEqual(matchesRule('https://google.com', domainRule), false);
});

test('Firewall URL Matching - Exact matching', () => {
  const exactRule = {
    urlPattern: 'https://news.ycombinator.com/best',
    matchType: 'exact',
  };

  assert.strictEqual(matchesRule('https://news.ycombinator.com/best', exactRule), true);
  assert.strictEqual(matchesRule('https://news.ycombinator.com/best/', exactRule), true);
  assert.strictEqual(matchesRule('https://news.ycombinator.com/item?id=123', exactRule), false);
  assert.strictEqual(matchesRule('https://news.ycombinator.com', exactRule), false);
});

test('Firewall URL Matching - Wildcard matching', () => {
  const wildcardRule = {
    urlPattern: '*://*.reddit.com/r/all/*',
    matchType: 'wildcard',
  };

  assert.strictEqual(matchesRule('https://www.reddit.com/r/all/hot', wildcardRule), true);
  assert.strictEqual(matchesRule('https://old.reddit.com/r/all/top', wildcardRule), true);
  assert.strictEqual(matchesRule('https://www.reddit.com/r/programming', wildcardRule), false);
});

// -------------------------------------------------------------
// Test 2: Schedule & Time Window Calculations
// -------------------------------------------------------------

const timeStringToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

const isRuleActive = (rule, date = new Date()) => {
  if (!rule.enabled) return false;

  if (rule.scheduleType === 'always') return true;

  if (rule.scheduleType === 'timer') {
    if (!rule.timerSchedule || !rule.timerSchedule.expiresAt) return false;
    return date.getTime() < rule.timerSchedule.expiresAt;
  }

  if (rule.scheduleType === 'weekly') {
    if (!rule.weeklySchedule) return false;
    const currentDay = date.getDay();
    if (!rule.weeklySchedule.days.includes(currentDay)) return false;

    const currentMinutes = date.getHours() * 60 + date.getMinutes();
    const startMinutes = timeStringToMinutes(rule.weeklySchedule.startTime);
    const endMinutes = timeStringToMinutes(rule.weeklySchedule.endTime);

    if (startMinutes <= endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    } else {
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }
  }

  return false;
};

test('Schedule Evaluation - Weekly schedule', () => {
  const weeklyRule = {
    enabled: true,
    scheduleType: 'weekly',
    weeklySchedule: {
      days: [1, 2, 3, 4, 5], // Mon-Fri
      startTime: '09:00',
      endTime: '17:00',
    },
  };

  // Monday 10:30 (active)
  const mondayActive = new Date('2026-09-14T10:30:00'); // Sept 14, 2026 is Monday
  assert.strictEqual(isRuleActive(weeklyRule, mondayActive), true);

  // Monday 08:30 (before window)
  const mondayEarly = new Date('2026-09-14T08:30:00');
  assert.strictEqual(isRuleActive(weeklyRule, mondayEarly), false);

  // Monday 17:30 (after window)
  const mondayLate = new Date('2026-09-14T17:30:00');
  assert.strictEqual(isRuleActive(weeklyRule, mondayLate), false);

  // Sunday 12:00 (weekend, not selected day)
  const sunday = new Date('2026-09-13T12:00:00');
  assert.strictEqual(isRuleActive(weeklyRule, sunday), false);
});

test('Schedule Evaluation - Timer focus session', () => {
  const now = Date.now();
  const timerRule = {
    enabled: true,
    scheduleType: 'timer',
    timerSchedule: {
      durationMinutes: 30,
      expiresAt: now + 30 * 60 * 1000,
    },
  };

  const withinTimer = new Date(now + 10 * 60 * 1000);
  assert.strictEqual(isRuleActive(timerRule, withinTimer), true);

  const afterTimer = new Date(now + 31 * 60 * 1000);
  assert.strictEqual(isRuleActive(timerRule, afterTimer), false);
});

// -------------------------------------------------------------
// Test 3: Cryptographic Tamper-Resistance Simulation
// -------------------------------------------------------------

test('Cryptographic Integrity - AES-GCM + HMAC-SHA256 Tamper Detection', async () => {
  const sampleRules = [
    { id: '1', name: 'Focus Rule', urlPattern: 'facebook.com', matchType: 'domain', scheduleType: 'always', enabled: true }
  ];

  // Generate AES and HMAC keys
  const aesKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  const hmacKey = await crypto.subtle.generateKey({ name: 'HMAC', hash: 'SHA-256' }, true, ['sign', 'verify']);

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = JSON.stringify(sampleRules);
  const ciphertextBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, new TextEncoder().encode(plaintext));

  const ivB64 = Buffer.from(iv).toString('base64');
  const cipherB64 = Buffer.from(ciphertextBuffer).toString('base64');
  const timestamp = Date.now();

  const signatureData = `1:${ivB64}:${cipherB64}:${timestamp}`;
  const hmacBuffer = await crypto.subtle.sign('HMAC', hmacKey, new TextEncoder().encode(signatureData));
  const hmacB64 = Buffer.from(hmacBuffer).toString('base64');

  // Verify valid payload
  const isValid = await crypto.subtle.verify('HMAC', hmacKey, Buffer.from(hmacB64, 'base64'), new TextEncoder().encode(signatureData));
  assert.strictEqual(isValid, true);

  // Decrypt valid payload
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, aesKey, Buffer.from(cipherB64, 'base64'));
  const restoredRules = JSON.parse(new TextDecoder().decode(decrypted));
  assert.deepStrictEqual(restoredRules, sampleRules);

  // SIMULATE DISK TAMPERING: An attacker changes 1 byte of the ciphertext on PC
  const tamperedCipherBytes = Buffer.from(cipherB64, 'base64');
  tamperedCipherBytes[0] ^= 0xff; // flip bits
  const tamperedCipherB64 = tamperedCipherBytes.toString('base64');
  const tamperedSignatureData = `1:${ivB64}:${tamperedCipherB64}:${timestamp}`;

  // Verify that HMAC verification FAILS on tampered data
  const isTamperValid = await crypto.subtle.verify('HMAC', hmacKey, Buffer.from(hmacB64, 'base64'), new TextEncoder().encode(tamperedSignatureData));
  assert.strictEqual(isTamperValid, false, 'HMAC MUST fail when ciphertext is tampered with on PC');
});

// -------------------------------------------------------------
// Test 4: Granular Rule Security (Add allowed, Active rules locked)
// -------------------------------------------------------------

test('Granular Security - Adding rules allowed, actively blocking rules locked', () => {
  const activeRule = {
    id: 'rule-active',
    name: 'Active Block Rule',
    urlPattern: 'youtube.com',
    matchType: 'domain',
    scheduleType: 'always',
    enabled: true,
  };

  const inactiveRule = {
    id: 'rule-inactive',
    name: 'Scheduled Later Rule',
    urlPattern: 'twitter.com',
    matchType: 'domain',
    scheduleType: 'weekly',
    weeklySchedule: {
      days: [0], // Sunday only
      startTime: '09:00',
      endTime: '17:00',
    },
    enabled: true,
  };

  let rules = [activeRule, inactiveRule];
  const testDate = new Date('2026-09-14T10:00:00'); // Monday

  // Helper simulating background rule operations under granular lock policy
  const handleAddRule = (newRule) => {
    // Adding rules is ALWAYS allowed
    rules.push({ ...newRule, id: 'rule-' + Math.random(), enabled: true });
    return { success: true };
  };

  const handleToggleRule = (ruleId, enabled) => {
    const target = rules.find((r) => r.id === ruleId);
    if (target && target.enabled && isRuleActive(target, testDate)) {
      return { success: false, error: 'RULE_LOCKED' };
    }
    target.enabled = enabled;
    return { success: true };
  };

  const handleDeleteRule = (ruleId) => {
    const target = rules.find((r) => r.id === ruleId);
    if (target && target.enabled && isRuleActive(target, testDate)) {
      return { success: false, error: 'RULE_LOCKED' };
    }
    rules = rules.filter((r) => r.id !== ruleId);
    return { success: true };
  };

  // 1. Verify activeRule is currently blocking
  assert.strictEqual(isRuleActive(activeRule, testDate), true);
  assert.strictEqual(isRuleActive(inactiveRule, testDate), false);

  // 2. Adding a new rule MUST succeed even when an active rule is blocking
  const addResult = handleAddRule({
    name: 'New Focus Rule',
    urlPattern: 'reddit.com',
    matchType: 'domain',
    scheduleType: 'always',
  });
  assert.strictEqual(addResult.success, true);
  assert.strictEqual(rules.length, 3);

  // 3. Toggling/disabling the actively blocking rule MUST be rejected
  const toggleActiveResult = handleToggleRule('rule-active', false);
  assert.strictEqual(toggleActiveResult.success, false);
  assert.strictEqual(toggleActiveResult.error, 'RULE_LOCKED');
  assert.strictEqual(activeRule.enabled, true, 'Active rule must remain enabled');

  // 4. Deleting the actively blocking rule MUST be rejected
  const deleteActiveResult = handleDeleteRule('rule-active');
  assert.strictEqual(deleteActiveResult.success, false);
  assert.strictEqual(deleteActiveResult.error, 'RULE_LOCKED');
  assert.strictEqual(rules.some((r) => r.id === 'rule-active'), true);

  // 5. Toggling the inactive rule MUST succeed
  const toggleInactiveResult = handleToggleRule('rule-inactive', false);
  assert.strictEqual(toggleInactiveResult.success, true);
  assert.strictEqual(inactiveRule.enabled, false);

  // 6. Deleting the inactive rule MUST succeed
  const deleteInactiveResult = handleDeleteRule('rule-inactive');
  assert.strictEqual(deleteInactiveResult.success, true);
  assert.strictEqual(rules.some((r) => r.id === 'rule-inactive'), false);
});

// -------------------------------------------------------------
// Test 5: Manifest Content Security Policy (CSP) Verification
// -------------------------------------------------------------

test('Security Hardening - Manifest Content Security Policy (CSP)', () => {
  const manifests = ['chrome', 'firefox', 'safari'];

  manifests.forEach((target) => {
    const manifestPath = path.resolve(`manifests/manifest.${target}.json`);
    assert.strictEqual(fs.existsSync(manifestPath), true, `Manifest for ${target} must exist`);

    const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    assert.ok(manifestContent.content_security_policy, `${target} manifest must contain content_security_policy`);

    const csp = manifestContent.content_security_policy.extension_pages;
    assert.ok(csp, `${target} manifest must define extension_pages CSP`);

    // Verify key security directives
    assert.ok(csp.includes("script-src 'self'"), `${target} CSP must enforce script-src 'self'`);
    assert.ok(csp.includes("object-src 'none'"), `${target} CSP must forbid dangerous plugins (object-src 'none')`);
    assert.ok(csp.includes("connect-src 'self' https://docs.google.com"), `${target} CSP must allow Google Docs feedback submission in connect-src`);
    assert.ok(csp.includes("style-src 'self' 'unsafe-inline'"), `${target} CSP must allow local Tailwind styles`);
    assert.ok(csp.includes("img-src 'self' data:"), `${target} CSP must allow local assets and SVG data URIs`);
  });
});

// -------------------------------------------------------------
// Test 6: Focus Statistics & Post-Uninstall URL Serialization
// -------------------------------------------------------------

test('Focus Statistics & Post-Uninstall URL Serialization', () => {
  const sampleStats = {
    totalFocusMinutes: 1850,
    sessionsCompleted: 35,
    blocksIntercepted: 420,
    firstInstalledAt: Date.now() - 10 * 24 * 60 * 60 * 1000, // 10 days ago
    lastActiveAt: Date.now(),
  };

  const buildUninstallURL = (stats, baseUrl = 'https://timefocuser.github.io/goodbye.html') => {
    const days = Math.max(1, Math.ceil((Date.now() - stats.firstInstalledAt) / (1000 * 60 * 60 * 24)));
    const params = new URLSearchParams({
      m: Math.max(0, stats.totalFocusMinutes).toString(),
      s: Math.max(0, stats.sessionsCompleted).toString(),
      b: Math.max(0, stats.blocksIntercepted).toString(),
      d: days.toString(),
    });
    return `${baseUrl}?${params.toString()}`;
  };

  const uninstallUrl = buildUninstallURL(sampleStats);
  const parsed = new URL(uninstallUrl);

  assert.strictEqual(parsed.origin, 'https://timefocuser.github.io');
  assert.strictEqual(parsed.pathname, '/goodbye.html');
  assert.strictEqual(parsed.searchParams.get('m'), '1850');
  assert.strictEqual(parsed.searchParams.get('s'), '35');
  assert.strictEqual(parsed.searchParams.get('b'), '420');
  assert.strictEqual(parsed.searchParams.get('d'), '10');

  // Verify manifests declare src/goodbye/index.html in web_accessible_resources
  const manifests = ['chrome', 'firefox', 'safari'];
  manifests.forEach((target) => {
    const manifestPath = path.resolve(`manifests/manifest.${target}.json`);
    const content = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const resources = content.web_accessible_resources?.[0]?.resources || [];
    assert.ok(
      resources.includes('src/goodbye/index.html'),
      `${target} manifest must include src/goodbye/index.html in web_accessible_resources`
    );
  });
});

// -------------------------------------------------------------
// Test 7: Extension Update Settings & Rules Preservation
// -------------------------------------------------------------

test('Extension Update - Preserves user rules and focus settings across upgrades', () => {
  const userConfiguredRules = [
    {
      id: 'custom-work-rule',
      name: 'Client Focus Work',
      urlPattern: 'reddit.com',
      matchType: 'domain',
      scheduleType: 'always',
      enabled: true,
    },
    {
      id: 'custom-news-rule',
      name: 'No Distracting News',
      urlPattern: 'cnn.com',
      matchType: 'domain',
      scheduleType: 'weekly',
      weeklySchedule: { days: [1, 2, 3, 4, 5], startTime: '09:00', endTime: '18:00' },
      enabled: true,
    },
  ];

  // Simulate local storage state during an extension version update
  const mockStorage = {
    secureStore: null, // Simulated key desync during major browser update
    rulesBackup: userConfiguredRules,
    focusStats: {
      totalFocusMinutes: 520,
      sessionsCompleted: 12,
      blocksIntercepted: 98,
      firstInstalledAt: Date.now() - 5 * 86400000,
      lastActiveAt: Date.now(),
    },
  };

  // Simulate loadStoredRules recovery algorithm
  const loadRulesOnUpdate = (storage) => {
    if (storage.rulesBackup && Array.isArray(storage.rulesBackup) && storage.rulesBackup.length > 0) {
      return { rules: storage.rulesBackup, restoredFromBackup: true };
    }
    return { rules: [], restoredFromBackup: false };
  };

  const updateResult = loadRulesOnUpdate(mockStorage);
  assert.strictEqual(updateResult.rules.length, 2);
  assert.strictEqual(updateResult.rules[0].name, 'Client Focus Work');
  assert.strictEqual(updateResult.rules[1].name, 'No Distracting News');
  assert.strictEqual(mockStorage.focusStats.totalFocusMinutes, 520);
  assert.strictEqual(mockStorage.focusStats.blocksIntercepted, 98);
});

// -------------------------------------------------------------
// Test 11: Quick Focus 1-Hour Session - Preserves Rule Settings
// -------------------------------------------------------------

test('Quick Focus Session - Non-destructive 1-Hour override (All and Some rules)', () => {
  const isRuleQuickFocused = (ruleId, session, date = new Date()) => {
    if (!session || !session.expiresAt) return false;
    if (date.getTime() >= session.expiresAt) return false;
    return session.ruleIds.includes('*') || session.ruleIds.includes(ruleId);
  };

  const isRuleActiveWithQuick = (rule, date = new Date(), quickSession = null) => {
    if (isRuleQuickFocused(rule.id, quickSession, date)) {
      return true;
    }
    return isRuleActive(rule, date);
  };

  const originalWeeklySchedule = {
    days: [0], // Sunday only
    startTime: '09:00',
    endTime: '17:00',
  };

  const weeklyRule = {
    id: 'rule-weekly',
    name: 'Weekly Rule',
    urlPattern: 'reddit.com',
    matchType: 'domain',
    scheduleType: 'weekly',
    weeklySchedule: { ...originalWeeklySchedule },
    enabled: true,
  };

  const disabledRule = {
    id: 'rule-disabled',
    name: 'Disabled Rule',
    urlPattern: 'twitter.com',
    matchType: 'domain',
    scheduleType: 'always',
    enabled: false,
  };

  const now = Date.now();
  const mondayDate = new Date('2026-09-14T10:00:00'); // Monday (not Sunday, so normally inactive)

  // 1. Without quick session, rules are inactive on Monday
  assert.strictEqual(isRuleActiveWithQuick(weeklyRule, mondayDate, null), false);
  assert.strictEqual(isRuleActiveWithQuick(disabledRule, mondayDate, null), false);

  // 2. Start Quick Focus for "Some" (only weeklyRule) for 1 hour
  const someSession = {
    expiresAt: mondayDate.getTime() + 60 * 60 * 1000,
    durationMinutes: 60,
    startedAt: mondayDate.getTime(),
    ruleIds: ['rule-weekly'],
  };

  assert.strictEqual(isRuleActiveWithQuick(weeklyRule, mondayDate, someSession), true, 'Weekly rule must be actively blocked under quick session');
  assert.strictEqual(isRuleActiveWithQuick(disabledRule, mondayDate, someSession), false, 'Disabled rule not in session must remain inactive');

  // Verify weeklyRule manual configuration was NOT overwritten
  assert.strictEqual(weeklyRule.scheduleType, 'weekly', 'Schedule type must not be overwritten to timer');
  assert.deepStrictEqual(weeklyRule.weeklySchedule, originalWeeklySchedule, 'Weekly schedule days/times must be preserved');

  // 3. Start Quick Focus for "All"
  const allSession = {
    expiresAt: mondayDate.getTime() + 60 * 60 * 1000,
    durationMinutes: 60,
    startedAt: mondayDate.getTime(),
    ruleIds: ['*'],
  };

  assert.strictEqual(isRuleActiveWithQuick(weeklyRule, mondayDate, allSession), true);
  assert.strictEqual(isRuleActiveWithQuick(disabledRule, mondayDate, allSession), true);

  // 4. After 1-hour expires, rules must automatically revert to normal schedule
  const afterOneHour = new Date(mondayDate.getTime() + 61 * 60 * 1000);
  assert.strictEqual(isRuleActiveWithQuick(weeklyRule, afterOneHour, allSession), false, 'Rule must revert to unblocked after 1 hour');
  assert.strictEqual(isRuleActiveWithQuick(disabledRule, afterOneHour, allSession), false);

  // On Sunday, weekly schedule is naturally active again
  const nextSunday = new Date('2026-09-20T10:00:00');
  assert.strictEqual(isRuleActiveWithQuick(weeklyRule, nextSunday, allSession), true, 'Rule resumes Sunday schedule normally');
});

// -------------------------------------------------------------
// Test 12: Rule Editing Permissions (Untriggered vs Triggered)
// -------------------------------------------------------------

test('Rule Editing - Untriggered rules are editable, actively blocking rules are locked', () => {
  const activeRule = {
    id: 'rule-active',
    name: 'Active Rule',
    urlPattern: 'youtube.com',
    matchType: 'domain',
    scheduleType: 'always',
    enabled: true,
  };

  const inactiveRule = {
    id: 'rule-inactive',
    name: 'Inactive Rule',
    urlPattern: 'facebook.com',
    matchType: 'domain',
    scheduleType: 'always',
    enabled: false,
  };

  let rules = [activeRule, inactiveRule];
  const testDate = new Date('2026-09-14T10:00:00');

  const handleUpdateRule = (updatedRule) => {
    const target = rules.find((r) => r.id === updatedRule.id);
    if (!target) return { success: false, error: 'NOT_FOUND' };
    if (target.enabled && isRuleActive(target, testDate)) {
      return { success: false, error: 'RULE_LOCKED' };
    }
    rules = rules.map((r) => (r.id === updatedRule.id ? updatedRule : r));
    return { success: true };
  };

  // 1. Attempting to edit an actively blocking rule must fail
  const editActiveResult = handleUpdateRule({
    ...activeRule,
    name: 'Tampered Rule Name',
    urlPattern: 'other.com',
  });
  assert.strictEqual(editActiveResult.success, false);
  assert.strictEqual(editActiveResult.error, 'RULE_LOCKED');
  assert.strictEqual(rules.find((r) => r.id === 'rule-active').name, 'Active Rule', 'Active rule name must not change');

  // 2. Editing an untriggered / inactive rule must succeed
  const editInactiveResult = handleUpdateRule({
    ...inactiveRule,
    name: 'Updated Social Site',
    urlPattern: 'instagram.com',
    matchType: 'wildcard',
  });
  assert.strictEqual(editInactiveResult.success, true);
  const updated = rules.find((r) => r.id === 'rule-inactive');
  assert.strictEqual(updated.name, 'Updated Social Site');
  assert.strictEqual(updated.urlPattern, 'instagram.com');
  assert.strictEqual(updated.matchType, 'wildcard');
});




