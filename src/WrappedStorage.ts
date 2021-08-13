import {
  ApisNamespace, StorageAreaName, StorageAreaQuotas, StorageData
} from './types/apis';
import { ErrorListener } from './types/listeners';

type Listener = (data: any, oldData?: any) => void;
export type LoadCallback = (data?: any) => void;

const usageSize = (data: StorageData) => 
  new TextEncoder().encode( 
    Object.entries(data).map( ([key, val]) =>
      key + JSON.stringify(val)
    ).join('')
  ).length;

export default abstract class WrappedStorage<N extends ApisNamespace> {
  ns: N;
  areaName: StorageAreaName;
  key: string;
  listeners: Listener[];
  errorListeners: ErrorListener[];

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
    this.errorListeners = [];
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

  subscribe(fn: Listener) {
    typeof fn === 'function' && this.listeners.push(fn);
  }

  subscribeForError(fn: ErrorListener) {
    typeof fn === 'function' && this.errorListeners.push(fn);
  }

  fireErrorListeners(message: string, exceeded: boolean) {
    for (const fn of this.errorListeners) {
      fn(message, exceeded);
    }
  }

  callbackOnLoad(data: any, callback: LoadCallback, all?: boolean) {
    callback(
      !this.ns.runtime.lastError && (all? data : data && data[this.key])
    );
  }

  callbackOnSave(data: any, area: StorageAreaQuotas) {
    if (!this.ns.runtime.lastError)
      return;
    const {message} = this.ns.runtime.lastError;
    if (!message || !data || !area) {
      this.fireErrorListeners(message || '', false);
      return;
    }
    const b = this.areaName === StorageAreaName.sync &&
      area.QUOTA_BYTES_PER_ITEM &&
      usageSize({ [this.key]: data }) > area.QUOTA_BYTES_PER_ITEM;
    if (b) {
      this.fireErrorListeners(message, true);
      return;
    }
    this.load((allData?: any) => {
      const b = typeof allData === 'object' &&
        area.QUOTA_BYTES > 0 &&
        usageSize({ ...allData, [this.key]: data }) > area.QUOTA_BYTES;
      this.fireErrorListeners(message, b);
    }, true);
  }

  abstract load(fn: LoadCallback, all?: boolean): void;

  abstract save(data: any): void;
}
