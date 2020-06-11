import _ from 'lodash';

let storageData = {};
let listeners = [];

class StorageArea {
  constructor(name) {
    this.name = name;
  }
  get(keys, fn) {
    setTimeout(() => {
      typeof fn === 'function' &&
      fn(keys && _.pick(storageData, keys) || storageData);
    }, 0);
  }
  set(data) {
    const changes = {};
    for (const key in data) {
      const oldValue = storageData[key];
      const newValue = storageData[key] = data[key];
      changes[key] = {newValue, oldValue};
    }
    Object.keys(changes).length &&
    setTimeout(() => {
      for (const fn of listeners) {
        fn(changes, this.name);
      }
    }, 0);
  }
}

function addListener(fn) {
  typeof fn === 'function' && listeners.push(fn);
}

function reset() {
  storageData = {};
  listeners = [];
}

const chrome = {
  storage: {
    local: new StorageArea('local'),
    sync: new StorageArea('sync'),
    onChanged: {
      addListener
    },
    reset // non-standard method, only used directly by tests
  },
  runtime: {
    lastError: null
  }
};

export default chrome;
