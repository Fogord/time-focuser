import { Rule } from '../types';
import { DEV_DEFAULT_RULES, DEV_STORAGE_KEY as STORAGE_KEY } from '../constants';

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
