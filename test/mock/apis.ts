import {
  StorageAreaName, StorageData,
  StorageGetKeys, StorageGetCallback, StorageListener,
  StorageAreaCallbacked, StorageAreaPromised, ChromeNamespace, BrowserNamespace
} from '../../src/types/apis';
import { cloneDeep }  from '../../src/utils';

const pick = (obj: StorageData, keys: StorageGetKeys) => {
  if (typeof obj !== 'object')
    return obj;
  const ret: StorageData = {};
  keys = typeof keys === 'string'? [keys] : keys;
  const isArr = Array.isArray(keys);
  for (const key in obj) {
    if (isArr? keys.includes(key) : keys[key]) {
      ret[key] = obj[key];
    }
  }
  return ret;
}
let storageData: StorageData = {};
let listeners: StorageListener[] = [];

class SharedStorageArea {
  QUOTA_BYTES = 0;
  name: StorageAreaName;

  constructor(name: string) {
    this.name = name === StorageAreaName.sync? StorageAreaName.sync :
      StorageAreaName.local;
  }

  _get(keys?: StorageGetKeys, fn?: StorageGetCallback): void {
    const data = typeof keys !== 'undefined'? pick(storageData, keys) :
      storageData;
    setTimeout(() => {
      typeof fn === 'function' && fn(data);
    }, 0);
  }
  _set(data: StorageData, callback?: () => void) {
    const changes = {};
    for (const key in data) {
      const oldValue = cloneDeep(storageData[key]);
      const newValue = storageData[key] = cloneDeep(data[key]);
      changes[key] = {newValue, oldValue};
    }
    Object.keys(changes).length &&
    setTimeout(() => {
      for (const fn of listeners) {
        fn(changes, this.name);
      }
      typeof callback === 'function' && callback();
    }, 0);
  }
  clear() {
    storageData = {};
    listeners = [];
  }
}

class ChromeStorageArea extends SharedStorageArea {
  get(callback: StorageGetCallback): void
  get(
    keys: StorageGetCallback | StorageGetKeys, callback?: StorageGetCallback
  ): void {
    typeof keys === 'function'?
      this._get(undefined, keys as StorageGetCallback) :
      this._get(keys, callback);
  }
  set(data: StorageData, callback?: () => void) {
    this._set(data, callback);
  }
}

class BrowserStorageArea extends SharedStorageArea {
  get(keys?: StorageGetKeys): Promise<StorageData> {
    return new Promise(resolve => {
      this._get(keys, data => {
        resolve(data);
      });
    });
  }
  set(data: StorageData): Promise<void> {
    return new Promise(resolve => {
      this._set(data, () => {
        resolve();
      });
    });
  }
}

function addListener(fn: StorageListener) {
  typeof fn === 'function' && listeners.push(fn);
}

export const chrome = {
  storage: {
    local: new ChromeStorageArea('local') as StorageAreaCallbacked,
    sync: new ChromeStorageArea('sync') as StorageAreaCallbacked,
    onChanged: {
      addListener
    }
  },
  runtime: {
  }
} as ChromeNamespace;

export const browser = Object.assign({}, chrome, {
  storage: {
    local: new BrowserStorageArea('local') as StorageAreaPromised,
    sync: new BrowserStorageArea('sync') as StorageAreaPromised,
    onChanged: {
      addListener
    }
  }
}) as BrowserNamespace;
