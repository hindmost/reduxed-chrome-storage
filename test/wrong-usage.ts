import { expect } from 'chai';
import { createStore } from 'redux';

import {chrome} from './mock/apis';
import storeCreatorFactory from '../src';

globalThis.chrome = chrome;

describe('Wrong Usage', () => {

  describe('Factory', () => {

    it('if createStore parameter is missing, should throw an exception', () => {
      expect(() => {
        storeCreatorFactory({});
      }).to.throw('createStore');
    });

  });

  describe('Store creator', () => {

    it('if reducer parameter is missing, should throw an exception', () => {
      expect(() => {
        storeCreatorFactory({createStore})();
      }).to.throw('reducer');
    });

  });

});
