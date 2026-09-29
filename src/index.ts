import ReduxedStorage, { unpackState } from './ReduxedStorage';
import WrappedChromeStorage from './WrappedChromeStorage';
import WrappedBrowserStorage from './WrappedBrowserStorage';
import { ExtendedStore, StoreCreatorContainer } from './types/store';
import { ChromeNamespace, BrowserNamespace } from './types/apis';
import { ChangeListener, ErrorListener } from './types/listeners';
import { cloneDeep, isEqual, diffDeep, mergeOrReplace } from './utils';

enum Namespace {
  chrome = 'chrome',
  browser = 'browser'
}
declare const chrome: ChromeNamespace;
declare const browser: BrowserNamespace;

export {
  ChromeNamespace, BrowserNamespace
} from './types/apis';
export {
  ChangeListener, ErrorListener
} from './types/listeners';
export {
  ExtendedDispatch, ExtendedStore, StoreCreatorContainer
} from './types/store';

export interface ReduxedSetupOptions {
  namespace?: string;
  chromeNs?: ChromeNamespace;
  browserNs?: BrowserNamespace;
  storageArea?: string;
  storageKey?: string;
  isolated?: boolean;
  plainActions?: boolean;
  outdatedTimeout?: number;
  syncDelay?: number;
}

export interface ReduxedSetupListeners {
  onGlobalChange?: ChangeListener;
  onLocalChange?: ChangeListener;
  onError?: ErrorListener;
}

/**
 * Sets up Reduxed Chrome Storage
 * @param storeCreatorContainer a function that calls a store creator and
 *   returns the created Redux store
 * @param [options] object of options
 * @param [listeners] object of listeners
 * @returns a function that creates asynchronously a Redux store replacement
 *   connected to the state stored in chrome.storage
 */
function setupReduxed(
  storeCreatorContainer: StoreCreatorContainer,
  options?: ReduxedSetupOptions,
  listeners?: ReduxedSetupListeners
) {
  const {
    namespace, chromeNs, browserNs,
    storageArea, storageKey,
    isolated, plainActions, syncDelay, outdatedTimeout
  } = options || {};
  const {
    onGlobalChange, onLocalChange, onError
  } = listeners || {};
  if (typeof storeCreatorContainer !== 'function')
    throw new Error(`Missing argument for 'storeCreatorContainer'`);

  const storage = browserNs || namespace === Namespace.browser?
    new WrappedBrowserStorage({
      namespace: browserNs || browser, area: storageArea, key: storageKey
    }) : 
    new WrappedChromeStorage({
      namespace: chromeNs || chrome, area: storageArea, key: storageKey
    });
  typeof onGlobalChange === 'function' &&
  storage.regListener( (data, oldData) => {
    const store = new ReduxedStorage(
      storeCreatorContainer, storage, true, plainActions, syncDelay
    );
    const [ state ] = unpackState(data);
    const [ oldState ] = unpackState(oldData);
    onGlobalChange(store.initFrom(state), oldState);
  });
  isolated || storage.regShared();

  const instantiate = (resetState?: any): Promise<ExtendedStore> => {
    onError && storage.subscribeForError(onError);
    const store = new ReduxedStorage(
      storeCreatorContainer, storage,
      isolated, plainActions, syncDelay, outdatedTimeout,
      onLocalChange, resetState
    );
    return store.init();
  }

  return instantiate;
}

export { setupReduxed, cloneDeep, isEqual, diffDeep, mergeOrReplace }
