import { createStore } from 'redux';
import storeCreatorFactory, {ChangeListener} from '../../src';
import {chrome} from '../mock/apis';

export default function(changeListener?: ChangeListener) {
  return storeCreatorFactory({ createStore, chromeNs: chrome, changeListener });
}
