import { cloneDeep, isEqual, mergeOrReplace } from './utils';

export default class ReduxedStorage {
  /**
   * Redux interface to chrome.storage
   * @param {Object} obj
   * @param {function(function()[, Object, function()])} obj.createStore the Redux's createStore() function
   * @param {Object} obj.storage a WrappedStorage instance
   * @param {number} obj.bufferLife lifetime of the bulk actions buffer, in ms
   * @param {function(Object[, Object])} obj.reducer a reducing function
   * @param {Object} obj.initialState initial state of the store
   * @param {function(function())} obj.enhancer enhancer of the store
   */
  constructor({
    createStore, storage, bufferLife,
    reducer, initialState, enhancer
  }) {
    this.createStore = createStore;
    this.storage = storage;
    this.reducer = reducer;
    this.enhancer = enhancer;
    this.buffLife = bufferLife? Math.min(Math.max(bufferLife, 0), 2000) : 100;
    this.state = initialState;
    this.buffStore = null;
    this.lastState = null;
    this.listeners = [];
    this.dispatch = this.dispatch.bind(this);
    this.subscribe = this.subscribe.bind(this);
  }

  init() {
    const initialState = this.state;
    this.state = null;
    const defaultState = this.createStore(
      this.reducer, undefined, this.enhancer
    ).getState();
    // subscribe for changes in chrome.storage
    this.storage.subscribe(data => {
      if (isEqual(data, this.state))
        return;
      this.setState(data);
      for (const fn of this.listeners) {
        fn();
      }
    });
    // return a promise to be resolved when the last state (if any) is restored from chrome.storage
    return new Promise(resolve => {
      // try to restore the last state stored in chrome.storage, if any
      this.storage.load(storedState => {
        let state = storedState?
          mergeOrReplace(defaultState, storedState) : defaultState;
        if (initialState) {
          state = mergeOrReplace(state, initialState);
        }
        this.setState(state);
        if (!isEqual(state, storedState)) {
          this.storage.save(state);
        }
        resolve(this);
      });
    });
  }

  /**
   * Sets/replaces all the state to/with a new content
   * @param data a new content of the state
   */
  setState(data) {
    if (!data)
      return;
    this.state = cloneDeep(data);
  }

  /**
   * Returns the current state
   * @returns {Object} the current state
   */
  getState() {
    return this.state;
  }

  /**
   * Adds a listener for changes in the store
   * @param {function()} fn the listener
   * @returns {function()} a function that unsubscribes the listener
   */
  subscribe(fn) {
    typeof fn === 'function' && this.listeners.push(fn);
    return () => {
      if (typeof fn !== 'function')
        return;
      this.listeners = this.listeners.filter(v => v !== fn);
    };
  }

  /**
   * Dispatches a Redux action
   * @param {Object} action the Redux action
   * @returns {Object} the dispatched action
   */
  dispatch(action) {
    if (!this.buffStore) {
      // this.buffStore is to be used with sync actions
      this.buffStore = this.createStore(
        this.reducer, this.state, this.enhancer
      );
      // this.lastState is shared by both sync and async actions
      this.lastState = this.buffStore.getState();
      setTimeout(() => {
        this.buffStore = null;
      }, this.buffLife);
    }
    // lastStore, holding an extra reference to the last created store, is to be used with async actions (e.g. via Redux Thunk);
    // then when this.buffStore is reset to null this variable should still refer to the same store
    let lastStore = this.buffStore;
    // set up a one-time state change listener
    const unsubscribe = lastStore.subscribe(() => {
      // if this.buffStore is non-empty, use it for getting the current state,
      // otherwise an async action is implied, so use lastStore instead
      const state = (this.buffStore || lastStore).getState();
      // we need a state change to be effective, so the current state should differ from the last saved one
      if (isEqual(state, this.lastState))
        return;
      // save the current state in chrome.storage / update this.lastState
      this.storage.save(state);
      this.lastState = state;
      // as we already catched the 1st effective state change, we don't need this listener and lastStore anymore,
      // so we unsubscribe the former and reset the latter in order to release the related resources
      unsubscribe();
      lastStore = null;
    });
    return lastStore.dispatch(action);
  }
}
