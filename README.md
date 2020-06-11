# Reduxed Chrome Storage

Redux interface to [`chrome.storage`](https://developer.chrome.com/extensions/storage). The only way to get Redux working in [event-driven](https://developer.chrome.com/extensions/background_migration) (non-persistent) Chrome extensions (aside from full reproduction of the Redux code).

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
/* global chrome */

const storeCreator = storeCreatorFactory({ createStore, chrome });
storeCreator(reducer).then(store => {
  const state = store.getState();
  ...
});
```

### Advanced way (`async/await`):

```js
...
async () => {
  const storeCreator = storeCreatorFactory({ createStore, chrome });
  const store = await storeCreator(reducer);
  ...
}
...
```

#### One-liner:

```js
...
async () => {
  const store = await storeCreatorFactory({ createStore, chrome }) (reducer);
  ...
}
...
```

## License

Licensed under the MIT license.
