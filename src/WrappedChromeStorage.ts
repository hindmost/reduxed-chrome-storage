import {
  ChromeNamespace, StorageAreaCallbacked
} from './types/apis';
import WrappedStorage, {WrappedStorageLoadCallback} from './WrappedStorage';

export default class WrappedChromeStorage extends WrappedStorage<ChromeNamespace>{
  areaApi: StorageAreaCallbacked;

  constructor({
    namespace, area, key
  }: {
    namespace: ChromeNamespace, area?: string, key?: string
  }) {
    super({namespace, area, key});
    this.areaApi = this.ns.storage[this.areaName];
  }

  load(fn: WrappedStorageLoadCallback) {
    typeof fn === 'function' &&
    this.areaApi.get(this.key, data => {
      fn(!this.ns.runtime.lastError && data && data[this.key]);
    });
  }

  save(data: any) {
    this.areaApi.set({[this.key]: data}, () => {
      if (this.ns.runtime.lastError)
        throw new Error();
    });
  }
}
