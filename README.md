# Reduxed Chrome Storage

Redux interface to [`chrome.storage`](https://developer.chrome.com/extensions/storage). Unified way to use Redux in all modern browser extensions. The only way to get Redux working in [Manifest V3](https://developer.chrome.com/docs/extensions/mv3/intro/) Chrome extensions (aside from full reproduction of the Redux code).

[Related article](https://levelup.gitconnected.com/using-redux-in-event-driven-chrome-extensions-problem-solution-30eed1207a42)


## Installation

```
npm install reduxed-chrome-storage
```

## Usage

### Standard way (Promises):

```js
import { createStore } from 'redux';
import storeCreatorFactory from 'reduxed-chrome-storage';
import reducer from './reducer';

const options = {
  createStore: createStore,
  namespace?: ...,
  chromeNs?: ...,
  browserNs?: ...,
  storageArea?: ...,
  storageKey?: ...,
  bufferLife?: ...
};
const asyncStoreCreator = storeCreatorFactory(options);
asyncStoreCreator(reducer).then(store => {
  const state = store.getState();
  ...
});
```

### Advanced way (`async/await`):

```js
...
async () => {
  const asyncStoreCreator = storeCreatorFactory({ createStore });
  const store = await asyncStoreCreator(reducer);
  ...
}
...
```

#### One-liner:

```js
...
async () => {
  const store = await storeCreatorFactory({ createStore })( reducer );
  ...
}
...
```

### State change listening (special case - only makes sense in Manifest V3 service workers):

```js
import { createStore } from 'redux';
import storeCreatorFactory from 'reduxed-chrome-storage';
import reducer from './reducer';

const changeListener = (store, oldState) => {
  const currentState = store.getState();
  ...
};
const options = {
  createStore: createStore,
  changeListener: changeListener,
  namespace?: ...,
  chromeNs?: ...,
  browserNs?: ...,
  storageArea?: ...,
  storageKey?: ...,
  bufferLife?: ...
};
storeCreatorFactory(options)(reducer);
```

## Options

### createStore
Type: `function`

The original Redux's `createStore` function. The only mandatory option.

### namespace
Type: `string`<br>
Default: `'chrome'`

A string to identify the APIs namespace to be used, either `'chrome'` or `'browser'`. If this and the next two options are missing, the chrome namespace is used by default.

### chromeNs
Type: `host object` (`ChromeNamespace` in Typescript definition)

The chrome namespace within Manifest V2 extension. If this option is supplied, the previous one is ignored.

### browserNs
Type: `host object` (`BrowserNamespace` in Typescript definition)

The browser namespace within Firefox extension, or the chrome namespace within Manifest V3 chrome extension. You may pass the chrome namespace within Manifest V3 to make this library use Promise-based APIs under the hood. If this option is supplied, the previous two are ignored.

### changeListener
Type: `function` (`ChangeListener` in Typescript definition)<br>

A function to be called whenever the state changes, receives two parameters:

1. one-time store - container of the current state;
2. the previous state.

This option only makes sense in Manifest V3 service workers or event-driven background scripts. If this option is supplied, the async store creator returned by the factory is to only be used for holding the arguments to be passed to the original `createStore` upon a one-time store creation.

### storageArea
Type: `string`<br>
Default: `'sync'`

The name of `chrome.storage` area to be used, either `'sync'` or `'local'`.

### storageKey
Type: `string`<br>
Default: `'reduxed'`

Key under which the state will be stored/tracked in `chrome.storage`.

### bufferLife
Type: `number`<br>
Default: `100`

Lifetime of the bulk actions buffer (in ms).


## Notes

The usage is the _**same**_ for _**any**_ extension component (background or content script or popup - no matter).

`asyncStoreCreator` function returned by `storeCreatorFactory` is similar to the original Redux's `createStore` function except that unlike the latter `asyncStoreCreator` runs in async way returning a promise instead of a new store (which is due to asynchronous nature of `chrome.storage` API). `asyncStoreCreator` has the same syntax as its Redux's counterpart, though its 2nd parameter has a slightly different meaning. Unlike Redux, this library features state persistence through extension's activity periods (browser sessions in the case of persistent extension). With Reduxed Chrome Storage the current state is always persisted in `chrome.storage` by default. So there is no need to specify a previosly (somewhere) serialized state upon store creation/instantiation. However there may be a need to reset some parts (properties) of the state (e.g. user session variables) to their initial values upon store instantiation. And this is how the 2nd parameter is supposed to be used in Reduxed Chrome Storage: as initial values for some specific state properties. To be more specific, when a new store is created by `asyncStoreCreator`, first it tries to restore its last state from `chrome.storage`, then the result is merged with the 2nd parameter (if supplied).

If you're developing a Manifest V3 Chrome extension or a Manifest V2 extension with non-persistent background script, you have to keep in mind that your background script must comply with requirements of [event-based model](https://developer.chrome.com/extensions/background_pages). In the context of usage of this library it means that `asyncStoreCreator`'s promise callback should not contain any extension event listener (e.g. `chrome.runtime.onStartup` etc). If `async/await` syntax is used, there should not be any event listener after first `await` occurrence. Furthermore, `storeCreatorFactory` should not be called inside any event listener (as it implicitly sets up `chrome.storage.onChanged` event listener).

## License

Licensed under the MIT license.
