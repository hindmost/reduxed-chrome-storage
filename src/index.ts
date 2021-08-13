import ReduxedStorage from './ReduxedStorage';
import WrappedChromeStorage from './WrappedChromeStorage';
import WrappedBrowserStorage from './WrappedBrowserStorage';
import { StoreCreator, StoreEnhancer, Reducer } from 'redux';
import { ExtendedStore } from './types/store';
import { ChromeNamespace, BrowserNamespace } from './types/apis';
import { ChangeListener, ErrorListener } from './types/listeners';

enum Namespace {
  chrome = 'chrome',
  browser = 'browser'
}
declare const chrome: ChromeNamespace;
declare const browser: BrowserNamespace;

export { ChromeNamespace, BrowserNamespace } from './types/apis';
export { ChangeListener, ErrorListener } from './types/listeners';

/**
 * ReduxedChromeStorage creator factory.
 * Returns an async store creator that's supposed to replace
 * the original Redux's createStore function.
 * Unlike the original createStore() that immediately returns a store,
 * async store creator returns a Promise to be resolved
 * when the created store is ready
 * @param obj
 * @param obj.createStore the original Redux's createStore function.
 * The only mandatory property/option
 * @param obj.namespace string to identify the APIs namespace to be used,
 * either 'chrome' or 'browser'.
 * If this and the next two options are missing,
 * the chrome namespace is used by default
 * @param obj.chromeNs the chrome namespace within Manifest V2 extension.
 * If this option is supplied, the previous one is ignored
 * @param obj.browserNs the browser namespace within Firefox extension,
 * or the chrome namespace within Manifest V3 chrome extension.
 * If this option is supplied, the previous two are ignored
 * @param obj.changeListener a function to be called whenever the state changes,
 * receives two parameters:
 * 1) a one-time store - container of the current state;
 * 2) the previous state.
 * If this option is supplied, the async store creator returned by the factory
 * is not supposed to be immediately used for store creation
 * @param obj.errorListener a function to be called whenever an error occurs
 * during chrome.storage update, receives two parameters:
 * 1) an error message defined by storage API;
 * 2) a boolean indicating if the limit for the used storage area is exceeded
 * @param obj.storageArea the name of chrome.storage area to be used,
 * either 'local' or 'sync', defaults to 'local'
 * @param obj.storageKey key under which the state will be stored/tracked
 * in chrome.storage, defaults to 'reduxed'
 * @param obj.bufferLife lifetime of the bulk actions buffer (in ms),
 * defaults to 100
 * @returns an async store creator to replace the original createStore function
 */
export default function reduxedStorageCreatorFactory({
  createStore,
  namespace, chromeNs, browserNs,
  changeListener,
  errorListener,
  storageArea, storageKey, bufferLife
}: {
  createStore: StoreCreator,
  namespace?: string,
  chromeNs?: ChromeNamespace,
  browserNs?: BrowserNamespace,
  changeListener?: ChangeListener,
  errorListener?: ErrorListener,
  storageArea?: string,
  storageKey?: string,
  bufferLife?: number
}) {
  if (typeof createStore !== 'function')
    throw new Error(`Missing 'createStore' property/option`);

  const storage = browserNs || namespace === Namespace.browser?
    new WrappedBrowserStorage({
      namespace: browserNs || browser, area: storageArea, key: storageKey
    }) : 
    new WrappedChromeStorage({
      namespace: chromeNs || chrome, area: storageArea, key: storageKey
    });
  storage.init();
  typeof errorListener === 'function' &&
  storage.subscribeForError(errorListener);

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
    if (typeof changeListener !== 'function')
      return store.init();
    storage.subscribe((data, oldData) => {
      changeListener(store.initFrom(data), oldData);
    });
    return store.uninit();
  }

  return asyncStoreCreator;
}
