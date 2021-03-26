import { createStore } from 'redux';
import storeCreatorFactory from '../../src';
import {chrome} from '../mock/apis';

export default function() {
  return storeCreatorFactory({ createStore, chromeNs: chrome });
}
