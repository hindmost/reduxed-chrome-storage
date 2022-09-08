# Reduxed Chrome Storage

Redux interface to [`chrome.storage`](https://developer.chrome.com/extensions/storage) ([`browser.storage`](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage)). A unified way to use Redux in all modern browser extensions. The only way to get Redux working in [Manifest V3](https://developer.chrome.com/docs/extensions/mv3/intro/) Chrome extensions.

[Related article](https://levelup.gitconnected.com/using-redux-in-event-driven-chrome-extensions-problem-solution-30eed1207a42)

Table of contents
=================

* [Installation](#installation)
* [How To Use](#how-to-use)
  * [Common use case](#common-use-case)
  * [Special use case: Manifest V3 service worker](#special-use-case-manifest-v3-service-worker)
  * [Tracking errors](#tracking-errors)
* [setupReduxed() function](#setupreduxed()-function)
  * [Store creator container](#store-creator-container)
  * [Options](#options)
  * [Listeners](#listeners)
  * [The returning function](#the-returning-function)
* [Utility functions](#utility-functions)
* [How It Works / Caveats](#how-it-works-caveats)
  * [JSON stringification of the state](#json-stringification-of-the-state)
  * [Internal store, external state updates and outdated actions](#internal-store-external-state-updates-and-outdated-actions)
* [License](#license)


## Installation

```
npm install reduxed-chrome-storage
```

## How To Use

### Common use case

```typescript
import {
  setupReduxed, ReduxedSetupOptions
} from 'reduxed-chrome-storage';
import { configureStore } from '@reduxjs/toolkit';
import reducer from './reducer';

const storeCreatorContainer = (preloadedState?: any) =>
  configureStore({reducer, preloadedState});
const options: ReduxedSetupOptions = { ... };
const instantiate = setupReduxed(storeCreatorContainer, options);
// Obtain a replacement store instance
//   Option #1: Promise style
instantiate().then(store => {
  const state = store.getState();
  ...
});
//   Option #2: async/await style
async () => {
  const store = await instantiate();
  const state = store.getState();
  ...
}
```

### Special use case: Manifest V3 service worker

```typescript
import {
  setupReduxed, diffDeep, isEqual,
  ReduxedSetupOptions, ReduxedSetupListeners, ChangeListener
} from 'reduxed-chrome-storage';
...

// In order to track state changes set onGlobalChange and(or) onLocalChange
// properties within 3rd argument of setupReduxed like below
// instead of calling store.subscribe() in each API event listener

const globalChangeListener: ChangeListener = (store, previousState) => {
  const state = store.getState();
  // Below is an example how to filter down state changes
  // by comparing current state with previous one
  const diff = diffDeep(state, previousState);
  if (diff && ['someKey', 'anotherKey'].some(key => key in diff)) {
    ...
  }
};

const localChangeListener: ChangeListener = (store, previousState) => {
  const state = store.getState();
  // Another (a simpler) example how to filter down state changes
  if (isEqual(state.someKey, previousState.someKey)) {
    ...
  }
};

const storeCreatorContainer = ...;
const options: ReduxedSetupOptions = { ... };
const listeners: ReduxedSetupListeners = {
  onGlobalChange: globalChangeListener,
  onLocalChange: localChangeListener
};
const instantiate = setupReduxed(storeCreatorContainer, options, listeners);

// General pattern
chrome.{API}.on{Event}.addListener(async () => {
  // Obtain a store instance
  const store = await instantiate();
  const state = store.getState();
  ...
});

// Specific example
chrome.runtime.onStartup.addListener(async () => {
  // Obtain a store instance
  const store = await instantiate();
  const state = store.getState();
  ...
});
...
```

### Tracking errors

```typescript
import {
  setupReduxed, ReduxedSetupListeners, ErrorListener
} from 'reduxed-chrome-storage';
...

// errorListener will be called whenever an error occurs
// during chrome.storage update
const errorListener: ErrorListener = (message, exceeded) => {
  ...
};
const storeCreatorContainer = ...;
const listeners: ReduxedSetupListeners = {
  onError: errorListener
};
const instantiate = setupReduxed(storeCreatorContainer, { ... }, listeners);
...
```


## setupReduxed() function

This library exports four named functions: `setupReduxed()` as well as three utility functions to be described later. As its name suggests, `setupReduxed()` function sets up Reduxed Chrome Storage allowing to get a Redux store replacement connected to the state in `chrome.storage` (here and below `chrome.storage` means both `chrome.storage` itself and Webextensions' `browser.storage`). `setupReduxed()` receives three arguments (to be described below) and returns an async function (TBD below too).

Note: `setupReduxed()` must only be called once per extension component (popup, content script etc.).

### Store creator container

`setupReduxed()` expects its first argument (the only mandatory one) to be a _store creator container_. _Store creator container_ is a function that calls a _store creator_ and returns the result that is a Redux store. It receives one argument to be passed as the `preloadedState` argument into the store creator. _Store creator_ is either the Redux's [`createStore()`](https://redux.js.org/api/createstore) or any function that wraps the `createStore()`, e.g. [`configureStore()`](https://redux-toolkit.js.org/api/configureStore) of Redux Toolkit.

### Options

`setupReduxed()` allows to customize the setup via _options_. _Options_ are specified as named properties within optional second argument. Below is the list of available options.

#### namespace
Type: `string`<br>
Default: `'chrome'`

A string to identify the APIs namespace to be used, either `'chrome'` or `'browser'`. If this and the next two options are missing, the chrome namespace is used by default.

#### chromeNs
Type: `host object` (`ChromeNamespace` in Typescript definition)

The chrome namespace within Manifest V2 extension. If this option is supplied, the previous one is ignored.

#### browserNs
Type: `host object` (`BrowserNamespace` in Typescript definition)

The browser namespace within Firefox extension, or the chrome namespace within Manifest V3 chrome extension. You may pass the chrome namespace within Manifest V3 to make this library use Promise-based APIs under the hood. If this option is supplied, the previous two are ignored.

#### storageArea
Type: `string`<br>
Default: `'local'`

The name of `chrome.storage` area to be used, either `'sync'` or `'local'`. Note: it is not recommended to use `sync` area for immediately storing the state of extension. Use `local` area instead - it has less strict limits than `sync`. If you need to sync the state (entirely or partially) to a user's account, create a temporary store of `sync` area, then copy the needed data to (or from) the main store (of `local` area).

#### storageKey
Type: `string`<br>
Default: `'reduxed'`

Key under which the state will be stored/tracked in `chrome.storage`.

#### isolated
Type: `boolean`<br>
Default: `false`

Check this option if your store in this specific extension component isn't supposed to receive state changes from other extension components. It is recommended to always check this option in Manifest V3 service worker and all extension-related pages (e.g. options page etc.) except popup page.

#### plainActions
Type: `boolean`<br>
Default: `false`

Check this option if your store is only supposed to dispatch plain object actions.

#### outdatedTimeout
Type: `number`<br>
Default: `1000`

Max. time (in ms) to wait for _outdated_ (async) actions to be completed (see [How It Works](#internal-store-external-state-updates-and-outdated-actions) section for details). This option is ignored if at least one of the previous two (`isolated`/`plainActions`) options is checked.

### Listeners

`setupReduxed()` also allows to specify an error listener as well as two kinds of state change listeners. These listeners are specified as named properties within optional third argument. Below are their descriptions.

#### onError
Type: `function` (`ErrorListener` in Typescript definition)<br>

A function to be called whenever an error occurs during `chrome.storage` update. Receives two arguments:

1. an error message defined by storage API;
2. a boolean indicating if the limit for the used storage area is exceeded.

#### onGlobalChange
Type: `function` (`ChangeListener` in Typescript definition)<br>

A function to be called whenever the state changes that may be caused by any extension component (popup etc.). Receives two arguments:

1. a temporary store representing the current state;
2. the previous state.

#### onLocalChange
Type: `function` (`ChangeListener` in Typescript definition)<br>

A function to be called whenever a store in this specific extension component (obviously a service worker) causes a change in the state. Receives two arguments:

1. reference to the store that caused this change in the state;
2. the previous state.

`onGlobalChange` (that gets state updates from all extension components) has a larger coverage than `onLocalChange` (that only gets state updates from specific extension component). However `onLocalChange` has the advantage that it gets state updates _immediately_ once they're done, unlike `onGlobalChange` that only gets state updates after they're passed through `chrome.storage` update cycle (`storage.set` call, then `storage.onChanged` event firing) which takes some time.

`onGlobalChange`/`onLocalChange` listeners only make sense in Manifest V3 service workers where they're to be used as a replacement of `store.subscribe`. In all other extension components (MV2 background scripts, popups etc.) the standard [`store.subscribe`](https://redux.js.org/api/store#subscribelistener) is supposed to be used (mostly indirectly) for tracking state changes.

### The returning function

`setupReduxed()` returns a function that creates asynchronously a Redux store replacement connected to the state stored in `chrome.storage`.

**_Receives_** one optional argument of any type: some value to which the state will be reset entirely or partially upon the store replacement creation.

**_Returns_** a `Promise` to be resolved when the created replacement store is ready.

Note: Like `setupReduxed()`, the returning function must only be called once per extension component. The only exception is a Manifest V3 service worker, where the returning function is to be called in each API event listener (see [How To Use](#special-use-case-manifest-v3-service-worker) section).

## Utility functions

Aside from `setupReduxed()`, this library also exports three utility functions optimised to work with JSON data: `isEqual`, `diffDeep` and `cloneDeep`. One may use these functions to compare/copy state-related data (see [How To Use](#special-use-case-manifest-v3-service-worker) section).

### isEqual

Checks deeply if two supplied values are equal.

**_Receives_**: two arguments - values to be compared.

**_Returns_**: a `boolean`.

### diffDeep

Finds the deep difference between two supplied values.

**_Receives_**: two arguments - values to be compared.

**_Returns_**: the found deep difference.

### cloneDeep

Creates a deep copy of supplied value using JSON stringification.

**_Receives_**: one argument - a value to copy.

**_Returns_**: the created deep copy.


## How It Works / Caveats

### JSON stringification of the state

With this library all the state is stored in `chrome.storage`. As known, all data stored in `chrome.storage` are JSON-stringified. This means that the state should not contain non-JSON values as they are to be lost anyway (to be removed or replaced with JSON primitive values). Using non-JSON values in the state may cause unwanted side effects. This is especially true for object properties explicitly set to `undefined` ( `{key: undefined, ...}` ).
 
### Internal store, external state updates and outdated actions

In order to ensure full compatibility with Redux API this library uses an internal Redux store - true Redux store created by the supplied store creator container upon initialisation of the replacement Redux store. Every Redux action dispatched on a replacement Redux store (returned by the `setupReduxed()` returning function) is forwarded to its internal Redux store that dispatches this action. As a result the current state in the replacement store is updated (synced) with the result state in the internal store. If a dispatching action is a plain object, the respective state update/change comes to the replacement store immediately. Otherwise, i.e. if this is an async action, it may take some time for the replacement store to receive the respective state update.

Such state updates as above (caused and received within the same store / extension component) are called _local_. But there can also be _external_ state updates - caused by stores in other extension components. Whenever a replacement store receives an external state update its internal Redux store is re-created (renewed) with a new state that is the result of merging the current state with the state resulted from the external state update (note that only object literals are actually merged, all other values incl. arrays are replaced). Such re-creation is the only way to address external state updates as they come via `chrome.storage` API that doesn't provide info (action or series of actions) how to reproduce this state update/change, only the result state. Once the re-creation is done, the former current state is lost (replaced with a new one). But the former internal Redux store isn't necessarily lost. If there are uncompleted (async) actions belonging to (initiated by) this store, they all (incl. the store) are stored in a sort of temporary memory. Such uncompleted actions, belonging to internal Redux store that is no longer actual, are called _outdated_. Outdated actions belonging to the same store are stored in the temporary memory until the timeout specified by `outdatedTimeout` option is exceeded (the time is counted from the moment the store was re-created i.e. became outdated). If an outdated action is completed before `outdatedTimeout` period has run out, the respective result state is to be merged with the current state of the replacement store. Otherwise this (still uncompleted) action is to be lost, along with the store it belongs to (and all other still uncompleted actions within this store).


## License

Licensed under the [MIT license](LICENSE).
