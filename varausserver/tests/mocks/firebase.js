/**
 * Mock Firebase helper for testing.
 * Simulates Firebase Realtime Database operations against an in-memory data store.
 */

let store = {};
let pushCounter = 0;

function getNestedValue(obj, pathParts) {
  let current = obj;
  for (const part of pathParts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = current[part];
  }
  return current;
}

function setNestedValue(obj, pathParts, value) {
  let current = obj;
  for (let i = 0; i < pathParts.length - 1; i++) {
    if (current[pathParts[i]] == null || typeof current[pathParts[i]] !== 'object') {
      current[pathParts[i]] = {};
    }
    current = current[pathParts[i]];
  }
  current[pathParts[pathParts.length - 1]] = value;
}

function deleteNestedValue(obj, pathParts) {
  let current = obj;
  for (let i = 0; i < pathParts.length - 1; i++) {
    if (current[pathParts[i]] == null) return;
    current = current[pathParts[i]];
  }
  delete current[pathParts[pathParts.length - 1]];
}

function parsePath(path) {
  return path.replace(/^\/+/, '').replace(/\/+$/, '').split('/').filter(Boolean);
}

function createRef(path) {
  const pathParts = parsePath(path);
  const lastKey = pathParts.length > 0 ? pathParts[pathParts.length - 1] : null;

  return {
    key: lastKey,

    once(eventType) {
      const val = pathParts.length > 0
        ? getNestedValue(store, pathParts)
        : store;
      const snapshot = {
        val() { return val !== undefined ? JSON.parse(JSON.stringify(val)) : null; },
        key: lastKey
      };
      return Promise.resolve(snapshot);
    },

    update(data) {
      // Merge data at path
      let current = store;
      for (let i = 0; i < pathParts.length; i++) {
        if (current[pathParts[i]] == null || typeof current[pathParts[i]] !== 'object') {
          current[pathParts[i]] = {};
        }
        current = current[pathParts[i]];
      }
      for (const key of Object.keys(data)) {
        current[key] = JSON.parse(JSON.stringify(data[key]));
      }
      return Promise.resolve();
    },

    remove() {
      if (pathParts.length > 0) {
        deleteNestedValue(store, pathParts);
      } else {
        store = {};
      }
      return Promise.resolve();
    },

    set(data) {
      if (pathParts.length > 0) {
        setNestedValue(store, pathParts, JSON.parse(JSON.stringify(data)));
      } else {
        store = JSON.parse(JSON.stringify(data));
      }
      return Promise.resolve();
    },

    push() {
      pushCounter++;
      const newKey = '_push_' + pushCounter + '_' + Date.now();
      const childPath = path.replace(/\/+$/, '') + '/' + newKey;
      const childRef = createRef(childPath);
      childRef.key = newKey;
      return childRef;
    }
  };
}

function createMockFirebase() {
  return {
    database() {
      return {
        ref(path) {
          return createRef(path || '/');
        }
      };
    },
    auth() {
      return {
        verifyIdToken(token) {
          // Default mock: return a decoded token with uid = token
          return Promise.resolve({ uid: token, sub: token });
        }
      };
    },
    /** Reset the in-memory store (call in beforeEach) */
    _reset() {
      store = {};
      pushCounter = 0;
    },
    /** Get a deep copy of the current store (for assertions) */
    _getStore() {
      return JSON.parse(JSON.stringify(store));
    },
    /** Seed the store with initial data */
    _seed(data) {
      store = JSON.parse(JSON.stringify(data));
    }
  };
}

module.exports = { createMockFirebase };
