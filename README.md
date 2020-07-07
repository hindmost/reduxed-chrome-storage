# Reduxed Chrome Storage

Redux interface to [`chrome.storage`](https://developer.chrome.com/extensions/storage). The only way to get Redux working in [event-driven](https://developer.chrome.com/extensions/background_migration) (non-persistent) Chrome extensions (aside from full reproduction of the Redux code).

[Related article](https://levelup.gitconnected.com/using-redux-in-event-driven-chrome-extensions-problem-solution-30eed1207a42)

## Installation

With [NPM](https://www.npmjs.com/):

```
npm install reduxed-chrome-storage
```

## Usage

### Standard way (Promises):

```js
// Note: the usage is the SAME for ANY extension component
// (background or content script or popup - no matter)

import { createStore } from 'redux';
import storeCreatorFactory from 'reduxed-chrome-storage';
import reducer from './reducer';

const storeCreator = storeCreatorFactory({ createStore });
storeCreator(reducer).then(store => {
  const state = store.getState();
  ...
});
```

### Advanced way (`async/await`):

```js
...
async () => {
  const storeCreator = storeCreatorFactory({ createStore });
  const store = await storeCreator(reducer);
  ...
}
...
```

#### One-liner:

```js
...
async () => {
  const store = await storeCreatorFactory({ createStore }) (reducer);
  ...
}
...
```

### Notes

`storeCreator` function returned by `storeCreatorFactory` is similar to the original Redux's `createStore` function except that the former runs in async way returning a promise instead of a new store (which is due to asynchronous nature of `chrome.storage` API). Although `storeCreator` has the same syntax as its Redux's counterpart, its 2nd parameter has a slightly different meaning. Unlike Redux, this library features state persistence through extension's activity periods (browser sessions in the case of persistent extension). With Reduxed Chrome Storage the current state is always persisted in `chrome.storage` by default. So there is no need to specify a previosly (somewhere) serialized state upon store creation/instantiation. However there may be a need to reset some parts (properties) of the state (e.g. user session variables) to their initial values upon store instantiation. And this is how the 2nd parameter is supposed to be used in Reduxed Chrome Storage: as initial values for some specific state properties. To be more specific, when a new store is created by `storeCreator`, first it tries to restore its last state from `chrome.storage`, then the result is merged with the 2nd parameter (if supplied).

If you declare your background script as non-persistent, you have to keep in mind that it must comply with requirements of [event-based model](https://developer.chrome.com/extensions/background_pages). In the context of usage of this library it means that `storeCreator`'s promise callback should not contain any extension event listener (e.g. `chrome.runtime.onStartup` etc). If `async/await` syntax is used, there should not be any event listener after first `await` occurrence. Furthermore, `storeCreatorFactory` should not be called inside any event listener (as it implicitly sets up `chrome.storage.onChanged` event listener).

## License

Licensed under the MIT license.
