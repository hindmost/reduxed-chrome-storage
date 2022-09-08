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
}

export interface ReduxedSetupListeners {
  onGlobalChange?: ChangeListener;
  onLocalChange?: ChangeListener;
  onError?: ErrorListener;
}

/**
 * Sets up Reduxed Chrome Storage
 * @param storeCreatorContainer a function that calls a store creator
 * and returns the created Redux store.
 * Receives one argument to be passed as the preloadedState argument
 * into the store creator. Store creator is either the Redux's createStore()
 * or any function that wraps the createStore(), e.g. RTK's configureStore()
 * @param options
 * @param options.namespace string to identify the APIs namespace to be used,
 * either 'chrome' or 'browser'. If this and the next two options are missing,
 * the chrome namespace is used by default
 * @param options.chromeNs the chrome namespace within Manifest V2 extension.
 * If this option is supplied, the previous one is ignored
 * @param options.browserNs the browser namespace within Firefox extension,
 * or the chrome namespace within Manifest V3 chrome extension.
 * If this option is supplied, the previous two are ignored
 * @param options.storageArea the name of chrome.storage area to be used,
 * either 'local' or 'sync'. Defaults to 'local'
 * @param options.storageKey the key under which the state will be
 * stored/tracked in chrome.storage. Defaults to 'reduxed'
 * @param options.isolated check this option if your store in this specific
 * extension component isn't supposed to receive state changes from other
 * extension components. Defaults to false
 * @param options.plainActions check this option if your store is only supposed
 * to dispatch plain object actions. Defaults to false
 * @param options.outdatedTimeout max. time (in ms) to wait for outdated (async)
 * actions to be completed. Defaults to 1000. This option is ignored
 * if at least one of the previous two is checked
 * @param listeners
 * @param listeners.onGlobalChange a function to be called whenever the state
 * changes that may be caused by any extension component (popup etc.).
 * Receives two arguments:
 * 1) a temporary store representing the current state;
 * 2) the previous state
 * @param listeners.onLocalChange a function to be called whenever a store in
 * this specific extension component causes a change in the state.
 * Receives two arguments:
 * 1) reference to the store that caused this change in the state;
 * 2) the previous state
 * @param listeners.onError a function to be called whenever an error
 * occurs during chrome.storage update. Receives two arguments:
 * 1) an error message defined by storage API;
 * 2) a boolean indicating if the limit for the used storage area is exceeded
 * @returns a function that creates asynchronously a Redux store replacement
 * connected to the state stored in chrome.storage.
 * Receives one optional argument: some value to which the state
 * will be reset entirely or partially upon the store replacement creation.
 * Returns a Promise to be resolved when the created store replacement is ready
 */
function setupReduxed(
  storeCreatorContainer: StoreCreatorContainer,
  options?: ReduxedSetupOptions,
  listeners?: ReduxedSetupListeners
) {
  const {
    namespace, chromeNs, browserNs,
    storageArea, storageKey,
    isolated, plainActions, outdatedTimeout
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
      storeCreatorContainer, storage, true, plainActions
    );
    const [ state ] = unpackState(data);
    const [ oldState ] = unpackState(oldData);
    onGlobalChange(store.initFrom(state), oldState);
  });
  isolated || storage.regShared();

  const instantiate = (resetState?: any): Promise<ExtendedStore> => {
    onError && storage.subscribeForError(onError);
    const store = new ReduxedStorage(
      storeCreatorContainer, storage, isolated, plainActions, outdatedTimeout,
      onLocalChange, resetState
    );
    return store.init();
  }

  return instantiate;
}

export { setupReduxed, cloneDeep, isEqual, diffDeep, mergeOrReplace }
