import {
  BrowserNamespace, StorageAreaPromised
} from './types/apis';
import WrappedStorage, { LoadCallback } from './WrappedStorage';

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

  load(fn: LoadCallback) {
    typeof fn === 'function' &&
    this.areaApi.get( this.key ).then( data => {
      this.callbackOnLoad(data, fn);
    });
  }

  save(data: any) {
    this.areaApi.set( {[this.key]: data} ).then( () => {
      const message = this.getErrorMessage();
      typeof message !== 'undefined' &&
      !this.checkQuotaPerItem(message, this.areaApi, data) &&
      this.areaApi.getBytesInUse(null).then( total => {
        this.checkQuota(message, this.areaApi, data, total);
      });
    });
  }
}
