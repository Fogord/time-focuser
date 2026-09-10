import { Rule } from '../types';
import { BLOCKED_PAGE_PATH } from '../constnats';

/**
 * Escapes regex special characters except '*' for wildcard conversion
 */
const escapeRegexExceptWildcard = (str: string): string => {
  return str.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Converts a wildcard pattern (e.g. *://*.reddit.com/*) to RegExp
 */
export const wildcardToRegex = (pattern: string): RegExp => {
  const escaped = escapeRegexExceptWildcard(pattern);
  const regexStr = '^' + escaped.replace(/\*/g, '.*') + '$';
  return new RegExp(regexStr, 'i');
};

/**
 * Checks if a given URL matches a Rule's pattern
 */
export const matchesRule = (url: string, rule: Rule): boolean => {
  try {
    const parsedUrl = new URL(url);
    const pattern = rule.urlPattern.trim();

    switch (rule.matchType) {
      case 'exact': {
        // Strip trailing slash for forgiving comparison
        const cleanUrl = url.replace(/\/$/, '');
        const cleanPattern = pattern.replace(/\/$/, '');
        return cleanUrl.toLowerCase() === cleanPattern.toLowerCase();
      }

      case 'domain': {
        // Match hostname or subdomains: e.g. "twitter.com" matches "twitter.com" and "sub.twitter.com"
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
    // If URL parsing fails, fallback to simple string check
    return url.includes(rule.urlPattern);
  }
};

/**
 * Finds the first active rule that matches the given URL
 */
export const findMatchingActiveRule = (url: string, activeRules: Rule[]): Rule | undefined => {
  // Ignore chrome internal URLs, extension URLs, and blank pages
  if (
    !url ||
    url.startsWith('chrome://') ||
    url.startsWith('chrome-extension://') ||
    url.startsWith('edge://') ||
    url.startsWith('about:')
  ) {
    return undefined;
  }

  return activeRules.find((rule) => matchesRule(url, rule));
};

/**
 * Sync active rules to declarativeNetRequest dynamic rules for network-level firewall
 */
export const syncDnrRules = async (activeRules: Rule[]): Promise<void> => {
  if (typeof chrome === 'undefined' || !chrome.declarativeNetRequest) {
    return;
  }

  try {
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const removeRuleIds = existingRules.map((r) => r.id);

    const addRules: chrome.declarativeNetRequest.Rule[] = [];
    let ruleIdCounter = 1;

    for (const rule of activeRules) {
      const pattern = rule.urlPattern.trim();
      let urlFilter: string | undefined;
      let regexFilter: string | undefined;

      if (rule.matchType === 'domain') {
        const domain = pattern.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
        urlFilter = `||${domain}`;
      } else if (rule.matchType === 'exact') {
        urlFilter = pattern;
      } else if (rule.matchType === 'wildcard') {
        urlFilter = pattern;
      } else if (rule.matchType === 'regex') {
        regexFilter = pattern;
      }

      if (urlFilter || regexFilter) {
        addRules.push({
          id: ruleIdCounter++,
          priority: 1,
          action: {
            type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
            redirect: {
              extensionPath: BLOCKED_PAGE_PATH,
            },
          },
          condition: {
            ...(urlFilter ? { urlFilter } : {}),
            ...(regexFilter ? { regexFilter } : {}),
            resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
          },
        });
      }
    }

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds,
      addRules,
    });
  } catch (error) {
    console.warn('[Firewall] Could not sync declarativeNetRequest dynamic rules:', error);
  }
}
