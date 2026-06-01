// LifeOS extension config.
// Central place for the app + API URLs so nothing is hardcoded across files.
//
// Defaults target local development. For a deployed build, either:
//   1) edit DEFAULT_CONFIG below, or
//   2) set an override at runtime via chrome.storage.local
//      ({ lifeOSConfig: { appUrl, apiUrl } }) — e.g. from an options page.
//
// NOTE: when you change APP_URL for production you must also update the
// `frame-src` entry in manifest.json (CSP cannot read this file).

const DEFAULT_CONFIG = {
  // The LifeOS frontend (what gets opened / iframed by the extension).
  appUrl: 'http://localhost:3222',
  // The LifeOS backend REST API base (…/api/v1).
  apiUrl: 'http://localhost:4000/api/v1',
};

// Synchronous defaults available immediately to every script.
const LIFEOS_CONFIG = { ...DEFAULT_CONFIG };

// Apply any persisted override, then notify listeners.
function loadLifeOSConfig() {
  return new Promise((resolve) => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['lifeOSConfig'], (result) => {
          const override = result && result.lifeOSConfig;
          if (override && typeof override === 'object') {
            if (override.appUrl) LIFEOS_CONFIG.appUrl = String(override.appUrl).replace(/\/+$/, '');
            if (override.apiUrl) LIFEOS_CONFIG.apiUrl = String(override.apiUrl).replace(/\/+$/, '');
          }
          resolve(LIFEOS_CONFIG);
        });
        return;
      }
    } catch (e) {
      // fall through to defaults
    }
    resolve(LIFEOS_CONFIG);
  });
}

// Kick off the async load immediately (best-effort).
const lifeOSConfigReady = loadLifeOSConfig();

// Expose for service worker (importScripts) and window contexts.
if (typeof self !== 'undefined') {
  self.LIFEOS_CONFIG = LIFEOS_CONFIG;
  self.loadLifeOSConfig = loadLifeOSConfig;
  self.lifeOSConfigReady = lifeOSConfigReady;
}
