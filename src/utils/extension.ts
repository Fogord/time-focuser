import { ExtensionMessage, ExtensionResponse } from '../types';

/**
 * Checks if running inside an active browser extension environment
 */
export const isExtensionEnvironment = (): boolean => {
  return typeof chrome !== 'undefined' && !!chrome.runtime?.id;
};

/**
 * Sends a message to the extension service worker with a typed Promise response
 */
export const sendExtensionMessage = <T = any>(
  message: ExtensionMessage
): Promise<ExtensionResponse<T>> => {
  return new Promise((resolve) => {
    if (!isExtensionEnvironment() || !chrome.runtime?.sendMessage) {
      resolve({ success: false, error: 'NOT_IN_EXTENSION_ENV' });
      return;
    }

    try {
      chrome.runtime.sendMessage(message, (response: ExtensionResponse<T>) => {
        if (chrome.runtime.lastError) {
          resolve({
            success: false,
            error: chrome.runtime.lastError.message || 'Extension runtime error',
          });
          return;
        }
        resolve(response || { success: false, error: 'Empty response from service worker' });
      });
    } catch (err: any) {
      resolve({ success: false, error: err?.message || 'Failed to send message' });
    }
  });
};

/**
 * Opens the options / rules dashboard in a full browser tab
 */
export const openOptionsPage = (): void => {
  if (typeof chrome !== 'undefined' && chrome.runtime?.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open('/src/options/index.html', '_blank');
  }
};

/**
 * Forces the browser to restart the extension and reload background workers from disk
 */
export const reloadExtension = (): void => {
  if (typeof chrome !== 'undefined' && chrome.runtime?.reload) {
    chrome.runtime.reload();
  }
};
