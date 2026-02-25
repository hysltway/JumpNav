(() => {
  'use strict';

  const ns = window.ChatGptNav;

  function isStorageReady() {
    return (
      typeof chrome !== 'undefined' &&
      chrome.storage &&
      chrome.storage.local &&
      typeof chrome.storage.local.get === 'function' &&
      typeof chrome.storage.local.set === 'function'
    );
  }

  function getRaw(key) {
    if (!isStorageReady()) {
      return Promise.resolve({ found: false, value: undefined });
    }
    return new Promise((resolve) => {
      try {
        chrome.storage.local.get([key], (items) => {
          if (chrome.runtime && chrome.runtime.lastError) {
            resolve({ found: false, value: undefined });
            return;
          }
          const found = Object.prototype.hasOwnProperty.call(items || {}, key);
          resolve({
            found,
            value: found ? items[key] : undefined
          });
        });
      } catch (error) {
        resolve({ found: false, value: undefined });
      }
    });
  }

  function setRaw(key, value) {
    if (!isStorageReady()) {
      return Promise.resolve(false);
    }
    return new Promise((resolve) => {
      try {
        chrome.storage.local.set({ [key]: value }, () => {
          if (chrome.runtime && chrome.runtime.lastError) {
            resolve(false);
            return;
          }
          resolve(true);
        });
      } catch (error) {
        resolve(false);
      }
    });
  }

  function getBoolean(key) {
    return getRaw(key).then(({ found, value }) => {
      if (!found || typeof value !== 'boolean') {
        return null;
      }
      return value;
    });
  }

  function setBoolean(key, value) {
    return setRaw(key, Boolean(value));
  }

  function getJson(key) {
    return getRaw(key).then(({ found, value }) => {
      if (!found) {
        return null;
      }
      if (value && typeof value === 'object') {
        return value;
      }
      if (typeof value !== 'string') {
        return null;
      }
      try {
        return JSON.parse(value);
      } catch (error) {
        return null;
      }
    });
  }

  function setJson(key, value) {
    return setRaw(key, value);
  }

  ns.storage = {
    getBoolean,
    setBoolean,
    getJson,
    setJson
  };
})();
