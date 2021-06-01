import {
  ApisNamespace, StorageAreaName
} from './types/apis';

interface WrappedStorageListener {
  (data: any, oldData?: any): void
}

export interface WrappedStorageLoadCallback {
  (data?: any): void
}

export default abstract class WrappedStorage<N extends ApisNamespace> {
  ns: N;
  areaName: StorageAreaName;
  key: string;
  listeners: WrappedStorageListener[];

  constructor({
    namespace, area, key
  }: {
    namespace: N, area?: string, key?: string
  }) {
    this.ns = namespace;
    this.areaName = area === StorageAreaName.sync? StorageAreaName.sync :
      StorageAreaName.local;
    this.key = key || 'reduxed';
    this.listeners = [];
  }

  init() {
    // Setup internal (shared) listener for chrome.storage.onChanged
    this.ns.storage.onChanged.addListener((changes, area) => {
      if (area !== this.areaName || !(this.key in changes))
        return;
      const {newValue, oldValue} = changes[this.key];
      if (!newValue)
        return;
      // call external chrome.storage.onChanged listeners
      for (const fn of this.listeners) {
        fn(newValue, oldValue);
      }
    });
  }

  subscribe(fn: WrappedStorageListener) {
    typeof fn === 'function' && this.listeners.push(fn);
  }

  abstract load(fn: WrappedStorageLoadCallback): void;

  abstract save(data: any): void;
}
