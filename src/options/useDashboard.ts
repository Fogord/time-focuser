import { useState, useEffect, useMemo, useCallback } from 'react';
import { Rule, LockState, QuickFocusSession } from '../types';
import { isRuleActive, computeLockState } from '../background/scheduler';
import { isExtensionEnvironment, sendExtensionMessage, reloadExtension } from '../utils/extension';
import {
  getDevRules,
  saveDevRules,
  getDevQuickFocusSession,
  saveDevQuickFocusSession,
} from '../utils/dev-storage';

export const useDashboard = () => {
  const isExtensionEnv = isExtensionEnvironment();
  const [rules, setRules] = useState<Rule[]>([]);
  const [lockState, setLockState] = useState<LockState>({
    isLocked: false,
    activeRuleIds: [],
    lockExpiresAt: null,
    tamperDetected: false,
    lastChecked: Date.now(),
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  const refreshState = useCallback(async () => {
    try {
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
        const currentRules = getDevRules();
        const devSession = getDevQuickFocusSession();
        setRules(currentRules);
        setLockState(computeLockState(currentRules, false, new Date(), devSession));
      }
    } catch (err) {
      console.error('[Dashboard] Failed to refresh state:', err);
    }
  }, [isExtensionEnv]);

  useEffect(() => {
    refreshState();
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      refreshState();
    }, 2000);
    return () => clearInterval(timer);
  }, [refreshState]);

  const handleAddRule = async (newRuleData: Omit<Rule, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (isExtensionEnv) {
      const response = await sendExtensionMessage({
        type: 'ADD_RULE',
        payload: { rule: newRuleData },
      });
      if (response.success) {
        refreshState();
        setErrorMessage(null);
      } else if (response.error) {
        setErrorMessage(response.error);
      }
    } else {
      const created: Rule = {
        ...newRuleData,
        id: 'dev_rule_' + Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const updated = [...rules, created];
      saveDevRules(updated);
      setRules(updated);
      setLockState(computeLockState(updated, false, new Date(), lockState.quickFocusSession));
      setErrorMessage(null);
    }
  };

  const handleEditClick = (rule: Rule) => {
    if (isRuleActive(rule, currentTime, lockState.quickFocusSession)) {
      setErrorMessage(`Cannot edit rule "${rule.name}" while it is actively blocking!`);
      return;
    }
    setEditingRule(rule);
    setIsEditModalOpen(true);
  };

  const handleUpdateRule = async (updatedRule: Rule) => {
    const target = rules.find((r) => r.id === updatedRule.id);
    if (target && isRuleActive(target, currentTime, lockState.quickFocusSession)) {
      setErrorMessage(`Cannot modify rule "${target.name}" while it is actively blocking!`);
      return;
    }

    if (isExtensionEnv) {
      const response = await sendExtensionMessage({
        type: 'UPDATE_RULE',
        payload: { rule: updatedRule },
      });
      if (response.success) {
        refreshState();
        setErrorMessage(null);
      } else if (response.error) {
        setErrorMessage(response.error);
      }
    } else {
      const updated = rules.map((r) => (r.id === updatedRule.id ? updatedRule : r));
      saveDevRules(updated);
      setRules(updated);
      setLockState(computeLockState(updated, false, new Date(), lockState.quickFocusSession));
      setErrorMessage(null);
    }
  };

  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    const target = rules.find((r) => r.id === ruleId);
    if (
      target &&
      target.enabled &&
      isRuleActive(target, currentTime, lockState.quickFocusSession)
    ) {
      setErrorMessage(
        `Cannot disable or modify rule "${target.name}" while it is actively blocking!`
      );
      return;
    }

    if (isExtensionEnv) {
      const response = await sendExtensionMessage({
        type: 'TOGGLE_RULE',
        payload: { ruleId, enabled },
      });
      if (response.success) {
        refreshState();
        setErrorMessage(null);
      } else if (response.error) {
        setErrorMessage(response.error);
      }
    } else {
      const updated = rules.map((r) =>
        r.id === ruleId ? { ...r, enabled, updatedAt: Date.now() } : r
      );
      saveDevRules(updated);
      setRules(updated);
      setLockState(computeLockState(updated, false, new Date(), lockState.quickFocusSession));
      setErrorMessage(null);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    const target = rules.find((r) => r.id === ruleId);
    if (
      target &&
      target.enabled &&
      isRuleActive(target, currentTime, lockState.quickFocusSession)
    ) {
      setErrorMessage(`Cannot delete rule "${target.name}" while it is actively blocking!`);
      return;
    }

    if (isExtensionEnv) {
      const response = await sendExtensionMessage({
        type: 'DELETE_RULE',
        payload: { ruleId },
      });
      if (response.success) {
        refreshState();
        setErrorMessage(null);
      } else if (response.error) {
        setErrorMessage(response.error);
      }
    } else {
      const updated = rules.filter((r) => r.id !== ruleId);
      saveDevRules(updated);
      setRules(updated);
      setLockState(computeLockState(updated, false, new Date(), lockState.quickFocusSession));
      setErrorMessage(null);
    }
  };

  const handleStartQuickFocusSession = async (ruleIds: string[], durationMinutes: number = 60) => {
    if (rules.length === 0) return;

    if (isExtensionEnv) {
      const response = await sendExtensionMessage({
        type: 'START_QUICK_FOCUS',
        payload: { ruleIds, durationMinutes },
      });
      if (response.success) {
        refreshState();
        setErrorMessage(null);
      } else if (response.error) {
        setErrorMessage(response.error);
      }
    } else {
      const session: QuickFocusSession = {
        expiresAt: Date.now() + durationMinutes * 60 * 1000,
        durationMinutes,
        startedAt: Date.now(),
        ruleIds,
      };
      saveDevQuickFocusSession(session);
      setLockState(computeLockState(rules, false, new Date(), session));
      setErrorMessage(null);
    }
  };

  const handleReloadExtension = () => {
    reloadExtension();
  };

  const filteredRules = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return rules;
    return rules.filter(
      (r) => r.name.toLowerCase().includes(q) || r.urlPattern.toLowerCase().includes(q)
    );
  }, [rules, searchQuery]);

  const activeBlockingCount = useMemo(() => {
    return rules.filter((r) => isRuleActive(r, currentTime, lockState.quickFocusSession)).length;
  }, [rules, currentTime, lockState.quickFocusSession]);

  return {
    isExtensionEnv,
    rules,
    lockState,
    searchQuery,
    setSearchQuery,
    filteredRules,
    activeBlockingCount,
    currentTime,
    errorMessage,
    setErrorMessage,
    isAddModalOpen,
    setIsAddModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    editingRule,
    setEditingRule,
    isQuickModalOpen,
    setIsQuickModalOpen,
    isTestModalOpen,
    setIsTestModalOpen,
    handleAddRule,
    handleEditClick,
    handleUpdateRule,
    handleToggleRule,
    handleDeleteRule,
    handleStartQuickFocusSession,
    handleReloadExtension,
    refreshState,
  };
};
