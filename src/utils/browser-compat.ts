/**
 * Unified cross-browser API wrapper supporting Chrome, Firefox (Gecko), and Safari (WebKit)
 */

export interface BrowserAPI {
  storage: typeof chrome.storage;
  runtime: typeof chrome.runtime;
  tabs: typeof chrome.tabs;
  declarativeNetRequest?: typeof chrome.declarativeNetRequest;
  webNavigation?: typeof chrome.webNavigation;
  alarms?: typeof chrome.alarms;
  action?: typeof chrome.action;
}

export const getBrowserApi = (): BrowserAPI => {
  if (typeof globalThis !== 'undefined') {
    // Check for browser (Firefox) or chrome (Chromium/Safari)
    const api = (globalThis as any).browser || (globalThis as any).chrome;
    if (api) {
      return api as BrowserAPI;
    }
  }

  // Fallback for non-extension / testing environments
  return {
    storage: {} as any,
    runtime: {} as any,
    tabs: {} as any,
  } as BrowserAPI;
};

export const browserApi = getBrowserApi();
