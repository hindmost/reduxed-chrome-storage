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

  load(fn: LoadCallback, all?: boolean) {
    typeof fn === 'function' &&
    this.areaApi.get( all? null : this.key , data => {
      this.callbackOnLoad(data, fn, all);
    });
  }

  save(data: any) {
    this.areaApi.set( {[this.key]: data} , () => {
      this.callbackOnSave(data, this.areaApi);
    });
  }
}
