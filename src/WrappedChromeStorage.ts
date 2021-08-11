import {
  ChromeNamespace, StorageAreaCallbacked
} from './types/apis';
import WrappedStorage, { LoadCallback } from './WrappedStorage';

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

  load(fn: LoadCallback) {
    typeof fn === 'function' &&
    this.areaApi.get( this.key , data => {
      this.callbackOnLoad(data, fn);
    });
  }

  save(data: any) {
    this.areaApi.set( {[this.key]: data} , () => {
      const message = this.getErrorMessage();
      typeof message !== 'undefined' &&
      !this.checkQuotaPerItem(message, this.areaApi, data) &&
      this.areaApi.getBytesInUse(null, total => {
        this.checkQuota(message, this.areaApi, data, total);
      })
    });
  }
}
