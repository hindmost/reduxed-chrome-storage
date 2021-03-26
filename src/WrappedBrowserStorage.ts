import {
  BrowserNamespace, StorageAreaPromised
} from './types/apis';
import WrappedStorage, {WrappedStorageLoadCallback} from './WrappedStorage';

export default class WrappedBrowserStorage extends WrappedStorage<BrowserNamespace> {
  areaApi: StorageAreaPromised;

  constructor({
    namespace, area, key
  }: {
    namespace: BrowserNamespace, area?: string, key?: string
  }) {
    super({namespace, area, key});
    this.areaApi = this.ns.storage[this.areaName];
  }

  load(fn: WrappedStorageLoadCallback) {
    typeof fn === 'function' &&
    this.areaApi.get(this.key)
    .then(data => {
      fn(!this.ns.runtime.lastError && data && data[this.key]);
    });
  }

  save(data: any) {
    this.areaApi.set({[this.key]: data})
    .then(() => {
      if (this.ns.runtime.lastError)
        throw new Error();
    });
  }
}
