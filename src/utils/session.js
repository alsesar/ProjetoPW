import Cookies from 'js-cookie';
import { STORAGE_KEYS } from '../constants/app-config';

let memoryUsername = '';

function safeStorage(method, storageType, key, value) {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const storage = window[storageType];

    if (!storage || typeof storage[method] !== 'function') {
      return null;
    }

    if (method === 'getItem') {
      return storage.getItem(key);
    }

    if (method === 'setItem') {
      storage.setItem(key, value);
      return true;
    }

    storage.removeItem(key);
    return true;
  } catch {
    return null;
  }
}

function safeGetCookie(key) {
  try {
    return Cookies.get(key) || '';
  } catch {
    return '';
  }
}

function safeSetCookie(key, value) {
  try {
    Cookies.set(key, value, { expires: 7 });
    return true;
  } catch {
    return false;
  }
}

function safeRemoveCookie(key) {
  try {
    Cookies.remove(key);
  } catch {
    // Ignore cookie access issues and keep other fallbacks working.
  }
}

export function getStoredUsername() {
  return (
    safeGetCookie(STORAGE_KEYS.username)
    || safeStorage('getItem', 'sessionStorage', STORAGE_KEYS.username)
    || safeStorage('getItem', 'localStorage', STORAGE_KEYS.username)
    || memoryUsername
    || ''
  );
}

export function hasActiveSession() {
  return Boolean(getStoredUsername().trim());
}

export function persistUsername(username, rememberMe) {
  const trimmedUsername = username.trim();

  if (!trimmedUsername) {
    return '';
  }

  clearSession();

  if (rememberMe) {
    const persistedInCookie = safeSetCookie(STORAGE_KEYS.username, trimmedUsername);

    if (!persistedInCookie) {
      const persistedInLocalStorage = safeStorage('setItem', 'localStorage', STORAGE_KEYS.username, trimmedUsername);

      if (!persistedInLocalStorage) {
        memoryUsername = trimmedUsername;
      }
    }
  } else {
    const persistedInSessionStorage = safeStorage('setItem', 'sessionStorage', STORAGE_KEYS.username, trimmedUsername);

    if (!persistedInSessionStorage) {
      memoryUsername = trimmedUsername;
    }
  }

  return trimmedUsername;
}

export function clearSession() {
  memoryUsername = '';
  safeRemoveCookie(STORAGE_KEYS.username);
  safeStorage('removeItem', 'sessionStorage', STORAGE_KEYS.username);
  safeStorage('removeItem', 'localStorage', STORAGE_KEYS.username);
}
