import {
  configureStore, Reducer, ReducersMapObject
} from '@reduxjs/toolkit';
import { setupReduxed, ChangeListener } from '../../src';
import { chrome } from '../mock/apis';

export default function (
  reducer: Reducer | ReducersMapObject, listener?: ChangeListener
) {
  const storeCreatorContainer = (preloadedState?: any) =>
    configureStore({
      reducer,
      preloadedState,
      devTools: false
    });

  return setupReduxed(storeCreatorContainer, {
    chromeNs: chrome
  }, {
    onGlobalChange: listener
  });
}
