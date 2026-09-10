import { useState, useEffect, useCallback } from 'react';
import { LockState } from '../types';
import { useCountdown } from '../hooks/useCountdown';
import { sendExtensionMessage, openOptionsPage } from '../utils/extension';

export const useBlockedScreen = () => {
  const [blockedUrl, setBlockedUrl] = useState<string>('');
  const [ruleName, setRuleName] = useState<string>('');
  const [lockState, setLockState] = useState<LockState | null>(null);

  const fetchLockState = useCallback(async () => {
    const response = await sendExtensionMessage<{ lockState: LockState }>({
      type: 'GET_STATE',
    });
    if (response && response.success && response.data) {
      setLockState(response.data.lockState);
    }
  }, []);

  useEffect(() => {
    // Read query parameters
    const params = new URLSearchParams(window.location.search);
    const url = params.get('url') || 'Restricted Website';
    const rule = params.get('rule') || 'Focus Policy';

    setBlockedUrl(url);
    setRuleName(rule);

    fetchLockState();
    const interval = setInterval(fetchLockState, 5000);
    return () => clearInterval(interval);
  }, [fetchLockState]);

  const { countdown } = useCountdown(lockState?.lockExpiresAt);

  const closeTab = () => {
    window.close();
  };

  return {
    blockedUrl,
    ruleName,
    lockState,
    countdown,
    closeTab,
    openDashboard: openOptionsPage,
  };
};
