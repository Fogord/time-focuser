import { useState, useEffect, useCallback, useMemo } from 'react';
import { FocusStats } from '../types';

export type FeedbackStatus = 'idle' | 'submitting' | 'success' | 'error';

export interface UseGoodbyeScreenResult {
  stats: FocusStats;
  daysActive: number;
  formattedFocusTime: string;
  hoursFocused: number;
  booksEquivalent: number;
  walksEquivalent: number;
  selectedFeedback: string | null;
  feedbackStatus: FeedbackStatus;
  feedbackSubmitted: boolean;
  message: string;
  setMessage: (message: string) => void;
  submitFeedback: (reason: string) => Promise<void>;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  handleReinstall: () => void;
}

export { CONTACT_FORM_URL, MESSAGE_ENTRY } from '../constants';
import { CONTACT_FORM_URL, MESSAGE_ENTRY, DEFAULT_DEMO_STATS } from '../constants';

export const useGoodbyeScreen = (): UseGoodbyeScreenResult => {
  const [stats, setStats] = useState<FocusStats>(() => {
    // 1. Attempt to parse query parameters from setUninstallURL (?m=...&s=...&b=...&d=...)
    try {
      const params = new URLSearchParams(window.location.search);
      const m = params.get('m');
      const s = params.get('s');
      const b = params.get('b');
      const d = params.get('d');

      if (m !== null || s !== null || b !== null || d !== null) {
        const totalMinutes = m ? Math.max(0, parseInt(m, 10) || 0) : 0;
        const sessions = s ? Math.max(0, parseInt(s, 10) || 0) : 0;
        const blocks = b ? Math.max(0, parseInt(b, 10) || 0) : 0;
        const days = d ? Math.max(1, parseInt(d, 10) || 1) : 1;

        return {
          totalFocusMinutes: totalMinutes,
          sessionsCompleted: sessions,
          blocksIntercepted: blocks,
          firstInstalledAt: Date.now() - days * 24 * 60 * 60 * 1000,
          lastActiveAt: Date.now(),
        };
      }
    } catch {
      // Ignore URL parsing errors
    }

    return DEFAULT_DEMO_STATS;
  });

  const [selectedFeedback, setSelectedFeedback] = useState<string | null>(null);
  const [feedbackStatus, setFeedbackStatus] = useState<FeedbackStatus>('idle');
  const [message, setMessage] = useState('');

  // If no URL parameters were provided, try loading live stats from extension storage if available
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hasParams = params.has('m') || params.has('s') || params.has('b');

    if (!hasParams && typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get('focusStats', (res) => {
        if (res && res.focusStats) {
          setStats(res.focusStats);
        }
      });
    }
  }, []);

  const daysActive = useMemo(() => {
    const elapsedMs = Date.now() - stats.firstInstalledAt;
    return Math.max(1, Math.ceil(elapsedMs / (1000 * 60 * 60 * 24)));
  }, [stats.firstInstalledAt]);

  const hoursFocused = useMemo(() => {
    return Math.round((stats.totalFocusMinutes / 60) * 10) / 10;
  }, [stats.totalFocusMinutes]);

  const formattedFocusTime = useMemo(() => {
    const totalMinutes = Math.max(0, stats.totalFocusMinutes);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0 && minutes === 0) {
      return '0 mins';
    }
    if (hours === 0) {
      return `${minutes} min${minutes === 1 ? '' : 's'}`;
    }
    if (minutes === 0) {
      return `${hours} hr${hours === 1 ? '' : 's'}`;
    }
    return `${hours} hr${hours === 1 ? '' : 's'} ${minutes} min${minutes === 1 ? '' : 's'}`;
  }, [stats.totalFocusMinutes]);

  // Real world equivalents: ~200 mins per non-fiction book, ~45 mins per outdoor walk
  const booksEquivalent = useMemo(() => {
    return Math.max(1, Math.round(stats.totalFocusMinutes / 200));
  }, [stats.totalFocusMinutes]);

  const walksEquivalent = useMemo(() => {
    return Math.max(1, Math.round(stats.totalFocusMinutes / 45));
  }, [stats.totalFocusMinutes]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setFeedbackStatus('submitting');

      const params = new URLSearchParams();
      params.append(MESSAGE_ENTRY, message);
      params.append('submit', 'Submit');

      try {
        const endpoint = CONTACT_FORM_URL.includes('?')
          ? `${CONTACT_FORM_URL.split('#')[0]}&${params.toString()}`
          : `${CONTACT_FORM_URL}?${params.toString()}`;

        await fetch(endpoint, {
          method: 'GET',
          mode: 'no-cors',
        });
        setFeedbackStatus('success');
      } catch (error) {
        console.error('Failed to submit contact form:', error);
        setFeedbackStatus('error');
      }
    },
    [message]
  );

  const submitFeedback = useCallback(async (reason: string) => {
    setSelectedFeedback(reason);
    setMessage(reason);
    setFeedbackStatus('submitting');

    const params = new URLSearchParams();
    params.append(MESSAGE_ENTRY, reason);
    params.append('submit', 'Submit');

    try {
      const endpoint = CONTACT_FORM_URL.includes('?')
        ? `${CONTACT_FORM_URL.split('#')[0]}&${params.toString()}`
        : `${CONTACT_FORM_URL}?${params.toString()}`;

      await fetch(endpoint, {
        method: 'GET',
        mode: 'no-cors',
      });
      setFeedbackStatus('success');
    } catch (error) {
      console.error('Failed to submit feedback to Google Docs:', error);
      setFeedbackStatus('error');
    }
  }, []);

  const handleReinstall = useCallback(() => {
    window.open('https://chromewebstore.google.com/', '_blank');
  }, []);

  const feedbackSubmitted = feedbackStatus === 'success' || feedbackStatus === 'error';

  return {
    stats,
    daysActive,
    formattedFocusTime,
    hoursFocused,
    booksEquivalent,
    walksEquivalent,
    selectedFeedback,
    feedbackStatus,
    feedbackSubmitted,
    message,
    setMessage,
    submitFeedback,
    handleSubmit,
    handleReinstall,
  };
};
