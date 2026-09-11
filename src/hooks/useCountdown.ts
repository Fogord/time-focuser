import { useState, useEffect } from 'react';
import { formatDuration } from '../utils/schedule';

export interface CountdownState {
  countdown: string;
  isExpired: boolean;
  diffMs: number;
}

/**
 * Common hook for real-time HH:MM:SS countdowns
 */
export const useCountdown = (expiresAt: number | null | undefined): CountdownState => {
  const [state, setState] = useState<CountdownState>(() => {
    if (!expiresAt) {
      return { countdown: '', isExpired: false, diffMs: 0 };
    }
    const diff = expiresAt - Date.now();
    return {
      countdown: diff > 0 ? formatDuration(diff) : 'Expiring...',
      isExpired: diff <= 0,
      diffMs: Math.max(0, diff),
    };
  });

  useEffect(() => {
    if (!expiresAt) {
      setState({ countdown: '', isExpired: false, diffMs: 0 });
      return;
    }

    const update = () => {
      const diff = expiresAt - Date.now();
      if (diff <= 0) {
        setState({ countdown: 'Expiring...', isExpired: true, diffMs: 0 });
      } else {
        setState({
          countdown: formatDuration(diff),
          isExpired: false,
          diffMs: diff,
        });
      }
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  return state;
};
