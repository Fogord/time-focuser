import { useState, useEffect, useCallback } from 'react';
import { Rule, LockState, QuickFocusSession } from '../types';
import { computeLockState } from '../background/scheduler';
import { isExtensionEnvironment, sendExtensionMessage, openOptionsPage } from '../utils/extension';
import {
  getDevRules,
  getDevQuickFocusSession,
  saveDevQuickFocusSession,
} from '../utils/dev-storage';
import { useCountdown } from '../hooks/useCountdown';

export const usePopup = () => {
  const isExtensionEnv = isExtensionEnvironment();
  const [rules, setRules] = useState<Rule[]>([]);
  const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);
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
      const response = await sendExtensionMessage<{
        rules: Rule[];
        lockState: LockState;
        quickFocusSession?: QuickFocusSession | null;
      }>({
        type: 'GET_STATE',
      });
      if (response && response.success && response.data) {
        setRules(response.data.rules || []);
        setLockState(response.data.lockState);
      }
    } else {
      const devRules = getDevRules();
      const devSession = getDevQuickFocusSession();
      setRules(devRules);
      setLockState(computeLockState(devRules, false, new Date(), devSession));
    }
  }, [isExtensionEnv]);

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 2000);
    return () => clearInterval(interval);
  }, [fetchState]);

  const startQuickFocusSession = async (ruleIds: string[], durationMinutes: number = 60) => {
    if (rules.length === 0) {
      openOptionsPage();
      return;
    }

    if (isExtensionEnv) {
      await sendExtensionMessage({
        type: 'START_QUICK_FOCUS',
        payload: { ruleIds, durationMinutes },
      });
      fetchState();
    } else {
      const session: QuickFocusSession = {
        expiresAt: Date.now() + durationMinutes * 60 * 1000,
        durationMinutes,
        startedAt: Date.now(),
        ruleIds,
      };
      saveDevQuickFocusSession(session);
      setLockState(computeLockState(rules, false, new Date(), session));
    }
  };

  return {
    isExtensionEnv,
    rules,
    lockState,
    countdown,
    isQuickModalOpen,
    setIsQuickModalOpen,
    startQuickFocusSession,
    openDashboard: openOptionsPage,
    fetchState,
  };
};
