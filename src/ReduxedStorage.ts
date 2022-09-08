import {
  Action, Reducer,
  Observer, Observable, Unsubscribe
} from 'redux';
import { v4 as uuid } from 'uuid';
import WrappedStorage from './WrappedStorage';
import { cloneDeep, isEqual, diffDeep, mergeOrReplace } from './utils';
import { ChangeListener } from './types/listeners';
import {
  ActionExtension, ExtendedStore, StoreCreatorContainer
} from './types/store';

type StandardListener = () => void;

const packState = (state: any, id: string, ts: number): [string, number, any] =>
  [id, ts, state];

export const unpackState = (data: any): [any, string, number] => {
  if (typeof data === 'undefined' || !Array.isArray(data) || data.length !== 3)
    return [data, '', 0];
  const [ id, ts, state ] = data;
  return typeof id === 'string' && typeof ts === 'number' ?
    [ state, id, ts ] :
    [data, '', 0];
}

export default class ReduxedStorage<
  W extends WrappedStorage<any>, A extends Action
> {
  container: StoreCreatorContainer;
  storage: W;
  isolated?: boolean;
  plain?: boolean;
  timeout: number;
  resetState: any;
  store: ExtendedStore;
  state: any;
  id: string;
  tmstamp: number;
  lisner?: ChangeListener;
  lisners: StandardListener[];
  unsub?: Unsubscribe;
  outdted: [number, Unsubscribe][];

  constructor(
    container: StoreCreatorContainer, storage: W,
    isolated?: boolean, plainActions?: boolean, outdatedTimeout?: number,
    localChangeListener?: ChangeListener, resetState?: any
  ) {
    this.container = container;
    this.storage = storage;
    this.isolated = isolated;
    this.plain = plainActions;
    this.timeout = outdatedTimeout? Math.max(outdatedTimeout, 500) : 1000;
    this.resetState = resetState;
    this.store = this._instantiateStore();
    this.state = null;
    this.id = uuid();
    this.tmstamp = 0;
    this.outdted = [];
    if (typeof localChangeListener === 'function')
      this.lisner = localChangeListener;
    this.lisners = [];
    this.getState = this.getState.bind(this);
    this.subscribe = this.subscribe.bind(this);
    this.dispatch = this.dispatch.bind(this);
    this.replaceReducer = this.replaceReducer.bind(this);
    this[Symbol.observable] = this[Symbol.observable].bind(this);
  }

  init(): Promise<ExtendedStore> {
    this.tmstamp || this.isolated ||
    this.storage.subscribe( (data, oldData) => {
      const [ state, id, timestamp ] = unpackState(data);
      if (id === this.id || isEqual(state, this.state))
        return;
      const newTime = timestamp >= this.tmstamp;
      const newState = newTime?
        mergeOrReplace(this.state, state) : mergeOrReplace(state, this.state);
      !newTime && isEqual(newState, this.state) ||
        ( this._setState(newState, timestamp), this._renewStore() );
      newTime && isEqual(newState, state) ||
        this._send2Storage();
      this._callListeners();
    });
    const defaultState = this.store.getState();
    // return a promise to be resolved when the last state (if any)
    // is restored from chrome.storage
    return new Promise( resolve => {
      this.storage.load( data => {
        const [storedState, , timestamp] = unpackState(data);
        let newState = storedState?
          mergeOrReplace(defaultState, storedState) : defaultState;
        if (this.resetState) {
          newState = mergeOrReplace(newState, this.resetState);
        }
        this._setState(newState, timestamp);
        this._renewStore();
        isEqual(newState, storedState) || this._send2Storage();
        resolve(this as ExtendedStore);
      });
    });
  }

  initFrom(state: any): ExtendedStore {
    this._setState(state, 0);
    this._renewStore();
    return this as ExtendedStore;
  }

  _setState(data: any, timestamp?: number) {
    this.state = cloneDeep(data);
    timestamp = typeof timestamp !== 'undefined'? timestamp : Date.now();
    if (timestamp > this.tmstamp) {
      this.tmstamp = timestamp;
    }
  }

  _renewStore() {
    this.plain? this.unsub && this.unsub() : this._clean();
    const store = this.store = this._instantiateStore(this.state);
    const now = Date.now();
    const n = this.outdted.length;
    this.outdted = this.outdted.map( ([t, u], i) =>
      t || i >= n-1 ? [t, u] : [now, u]
    );
    let state0 = cloneDeep(this.state);
    const unsubscribe = this.store.subscribe( () => {
      const state = store && store.getState();
      const sameStore = this.store === store;
      this._clean();
      if (isEqual(state, this.state))
        return;
      if (sameStore) {
        this._setState(state);
      } else {
        const diff = diffDeep(state, state0);
        if (typeof diff === 'undefined')
          return;
        this._setState(mergeOrReplace(this.state, diff));
        this._renewStore();
      }
      this._send2Storage();
      this._callListeners(true, state0);
      state0 = cloneDeep(state);
    });
    if (this.plain)
      this.unsub = unsubscribe;
    else
      this.outdted.push([0, unsubscribe]);
  }

  _clean() {
    if (this.plain)
      return;
    const now = Date.now();
    const n = this.outdted.length;
    this.outdted.forEach( ([timestamp, unsubscribe], i) => {
      if (i >= n-1 || now - timestamp < this.timeout)
        return;
      unsubscribe();
      delete this.outdted[i];
    });
  }

  _instantiateStore(state?: any) {
    const store = this.container(state);
    if (typeof store !== 'object' || typeof store.getState !== 'function')
      throw new Error(`Invalid 'storeCreatorContainer' supplied`);
    return store as ExtendedStore;
  }

  _send2Storage() {
    this.storage.save( packState(this.state, this.id, this.tmstamp) );
  }

  _callListeners(local?: boolean, oldState?: any) {
    local && this.lisner && this.lisner(this as ExtendedStore, oldState);
    for (const fn of this.lisners) {
      fn();
    }
  }

  getState() {
    return this.state;
  }

  subscribe(fn: StandardListener): Unsubscribe {
    typeof fn === 'function' && this.lisners.push(fn);
    return () => {
      if (typeof fn === 'function') {
        this.lisners = this.lisners.filter(v => v !== fn);
      }
    };
  }

  dispatch(action: A | ActionExtension) {
    return this.store.dispatch(action);
  }

  replaceReducer(nextReducer: Reducer): ExtendedStore {
    if (typeof nextReducer === 'function') {
      this.store.replaceReducer(nextReducer);
    }
    return this as ExtendedStore;
  }

  [Symbol.observable](): Observable<any> {
    const getState = this.getState;
    const subscribe = this.subscribe;
    return {
      subscribe(observer: Observer<any>) {
        if (typeof observer !== 'object' || observer === null) {
          throw new TypeError('Expected the observer to be an object.')
        }
        function observeState() {
          const observerAsObserver = observer as Observer<any>
          observerAsObserver.next && observerAsObserver.next(getState());
        }
        observeState();
        const unsubscribe = subscribe(observeState);
        return { unsubscribe };
      },
      [Symbol.observable]() {
        return this
      }
    }
  }
}
