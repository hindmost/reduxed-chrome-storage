import {
  ApisNamespace, StorageAreaName, StorageAreaQuotas
} from './types/apis';
import { ErrorListener } from './types/listeners';

type Listener = (data: any, oldData?: any) => void;
export type LoadCallback = (data?: any) => void;

export default abstract class WrappedStorage<N extends ApisNamespace> {
  ns: N;
  areaName: StorageAreaName;
  key: string;
  keyLen: number;
  lastSize: number;
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
    this.keyLen = this.key.length;
    this.lastSize = 0;
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
      this.lastSize = JSON.stringify(newValue).length;
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

  fireErrorListeners(message: string, exceeded?: boolean) {
    for (const fn of this.errorListeners) {
      fn(message, exceeded);
    }
  }

  getErrorMessage() {
    if (!this.ns.runtime.lastError)
      return;
    const {message} = this.ns.runtime.lastError;
    return message || '';
  }

  callbackOnLoad(data: any, callback: LoadCallback) {
    data = !this.ns.runtime.lastError && data && data[this.key];
    if (!this.lastSize && data) {
      this.lastSize = JSON.stringify(data).length;
    }
    callback(data);
  }

  checkQuotaPerItem(msg: string, area: StorageAreaQuotas, data: any) {
    const b = this.areaName === StorageAreaName.sync &&
      area && area.QUOTA_BYTES_PER_ITEM && data &&
      JSON.stringify(data).length + this.keyLen > area.QUOTA_BYTES_PER_ITEM;
    b && this.fireErrorListeners(msg);
    return b;
  }

  checkQuota(msg: string, area: StorageAreaQuotas, data: any, total: number) {
    const b = !this.ns.runtime.lastError &&
      area && area.QUOTA_BYTES && data && total > 0 && this.lastSize > 0 &&
      JSON.stringify(data).length - this.lastSize > area.QUOTA_BYTES - total;
    this.fireErrorListeners(msg, b);
  }

  abstract load(fn: LoadCallback): void;

  abstract save(data: any): void;
}
