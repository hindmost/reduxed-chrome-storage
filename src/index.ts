import ReduxedStorage from './ReduxedStorage';
import WrappedChromeStorage from './WrappedChromeStorage';
import WrappedBrowserStorage from './WrappedBrowserStorage';
import { StoreCreator, StoreEnhancer, Reducer } from 'redux';
import { ExtendedStore } from './types/store';
import {
  ChromeNamespace, BrowserNamespace
} from './types/apis';

enum Namespace {
  chrome = 'chrome',
  browser = 'browser'
}
declare const chrome: ChromeNamespace;
declare const browser: BrowserNamespace;

export {
  ChromeNamespace, BrowserNamespace
} from './types/apis';

/**
 * ReduxedChromeStorage creator factory.
 * Returns an async store creator that's supposed to replace
 * the original Redux's createStore function.
 * Unlike the original createStore() that immediately returns a store,
 * async store creator returns a Promise to be resolved
 * when the created store is ready
 * @param obj
 * @param obj.createStore the original Redux's createStore function.
 * The only mandatory parameter/property
 * @param obj.namespace string to identify the APIs namespace to be used,
 * either 'chrome' or 'browser'.
 * If this and the next two properties are missing,
 * the chrome namespace is used by default
 * @param obj.chromeNs the chrome namespace within Manifest V2 extension.
 * If this property is supplied, the previous one is ignored
 * @param obj.browserNs the browser namespace within Firefox extension,
 * or the chrome namespace within Manifest V3 chrome extension.
 * You may pass the chrome namespace within Manifest V3 to make this library
 * use Promise-based APIs under the hood.
 * If this property is supplied, the previous two are ignored
 * @param obj.storageArea the name of chrome.storage area to be used,
 * defaults to 'sync'
 * @param obj.storageKey the key to be used for storing/tracking data
 * in chrome.storage, defaults to 'reduxed'
 * @param obj.bufferLife lifetime of the bulk actions buffer (in ms),
 * defaults to 100
 * @returns an async store creator to replace the original createStore function
 */
export default function reduxedStorageCreatorFactory({
  createStore,
  namespace, chromeNs, browserNs,
  storageArea, storageKey, bufferLife
}: {
  createStore: StoreCreator,
  namespace?: string,
  chromeNs?: ChromeNamespace,
  browserNs?: BrowserNamespace,
  storageArea?: string,
  storageKey?: string,
  bufferLife?: number
}) {
  if (typeof createStore !== 'function')
    throw new Error(`Missing 'createStore' parameter/property`);

  const storage = browserNs || namespace === Namespace.browser?
    new WrappedBrowserStorage({
      namespace: browserNs || browser, area: storageArea, key: storageKey
    }) : 
    new WrappedChromeStorage({
      namespace: chromeNs || chrome, area: storageArea, key: storageKey
    });
  storage.init();

  function asyncStoreCreator(
    reducer: Reducer,
    enhancer?: StoreEnhancer
  ): Promise<ExtendedStore>
  function asyncStoreCreator(
    reducer: Reducer,
    initialState?: any,
    enhancer?: StoreEnhancer
  ): Promise<ExtendedStore>
  function asyncStoreCreator(
    reducer: Reducer,
    initialState?: any | StoreEnhancer,
    enhancer?: StoreEnhancer
  ): Promise<ExtendedStore> {
    if (typeof reducer !== 'function')
      throw new Error(`Missing 'reducer' parameter`);
    if (typeof initialState === 'function' && typeof enhancer === 'function')
      throw new Error(`Multiple 'enhancer' parameters unallowed`);
    if (typeof initialState === 'function' && typeof enhancer === 'undefined') {
      enhancer = initialState as StoreEnhancer
      initialState = undefined
    }
    const store = new ReduxedStorage({
      createStore, storage, bufferLife,
      reducer, initialState, enhancer
    });
    return store.init();
  }

  return asyncStoreCreator;
}
