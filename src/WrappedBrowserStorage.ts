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

  load(fn: LoadCallback, all?: boolean) {
    typeof fn === 'function' &&
    this.areaApi.get( all? null : this.key ).then( data => {
      this.callbackOnLoad(data, fn);
    });
  }

  save(data: any) {
    this.areaApi.set( {[this.key]: data} ).then( () => {
      this.callbackOnSave(data, this.areaApi);
    });
  }
}
