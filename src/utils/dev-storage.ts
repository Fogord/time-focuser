import { Rule, QuickFocusSession } from '../types';
import {
  DEV_DEFAULT_RULES,
  DEV_STORAGE_KEY as STORAGE_KEY,
  DEV_QUICK_FOCUS_KEY,
} from '../constants';

export { DEV_DEFAULT_RULES };

export const getDevRules = (): Rule[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEV_DEFAULT_RULES));
      return DEV_DEFAULT_RULES;
    }
    return JSON.parse(raw);
  } catch {
    return DEV_DEFAULT_RULES;
  }
};

export const saveDevRules = (rules: Rule[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
  } catch (err) {
    console.warn('[DevStorage] Failed to save rules to localStorage:', err);
  }
};

export const getDevQuickFocusSession = (): QuickFocusSession | null => {
  try {
    const raw = localStorage.getItem(DEV_QUICK_FOCUS_KEY);
    if (!raw) return null;
    const session: QuickFocusSession = JSON.parse(raw);
    if (session.expiresAt && session.expiresAt > Date.now()) {
      return session;
    }
    localStorage.removeItem(DEV_QUICK_FOCUS_KEY);
    return null;
  } catch {
    return null;
  }
};

export const saveDevQuickFocusSession = (session: QuickFocusSession | null): void => {
  try {
    if (session && session.expiresAt > Date.now()) {
      localStorage.setItem(DEV_QUICK_FOCUS_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(DEV_QUICK_FOCUS_KEY);
    }
  } catch (err) {
    console.warn('[DevStorage] Failed to save quick focus session to localStorage:', err);
  }
};
