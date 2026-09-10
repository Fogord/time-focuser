import { useState, useEffect, useCallback } from 'react';
import { Rule, LockState } from '../types';
import { computeLockState } from '../background/scheduler';
import { isExtensionEnvironment, sendExtensionMessage, openOptionsPage } from '../utils/extension';
import { getDevRules, saveDevRules } from '../utils/dev-storage';
import { useCountdown } from '../hooks/useCountdown';

export const usePopup = () => {
  const isExtensionEnv = isExtensionEnvironment();
  const [rules, setRules] = useState<Rule[]>([]);
  const [lockState, setLockState] = useState<LockState>({
    isLocked: false,
    activeRuleIds: [],
    lockExpiresAt: null,
    tamperDetected: false,
    lastChecked: Date.now(),
  });

  const { countdown } = useCountdown(lockState.isLocked ? lockState.lockExpiresAt : null);

  const fetchState = useCallback(async () => {
    if (isExtensionEnv) {
      const response = await sendExtensionMessage<{ rules: Rule[]; lockState: LockState }>({
        type: 'GET_STATE',
      });
      if (response && response.success && response.data) {
        setRules(response.data.rules || []);
        setLockState(response.data.lockState);
      }
    } else {
      const devRules = getDevRules();
      setRules(devRules);
      setLockState(computeLockState(devRules, false, new Date()));
    }
  }, [isExtensionEnv]);

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 2000);
    return () => clearInterval(interval);
  }, [fetchState]);

  const startQuickTimer = async (durationMinutes: number) => {
    if (rules.length === 0) {
      openOptionsPage();
      return;
    }

    const targetRule = rules[0];
    if (isExtensionEnv) {
      await sendExtensionMessage({
        type: 'START_TIMER',
        payload: { ruleId: targetRule.id, durationMinutes },
      });
      fetchState();
    } else {
      const updated = rules.map((r) =>
        r.id === targetRule.id
          ? {
              ...r,
              enabled: true,
              scheduleType: 'timer' as const,
              timerSchedule: {
                durationMinutes,
                expiresAt: Date.now() + durationMinutes * 60 * 1000,
              },
              updatedAt: Date.now(),
            }
          : r
      );
      saveDevRules(updated);
      setRules(updated);
      setLockState(computeLockState(updated, false, new Date()));
    }
  };

  return {
    isExtensionEnv,
    rules,
    lockState,
    countdown,
    startQuickTimer,
    openDashboard: openOptionsPage,
    fetchState,
  };
}
