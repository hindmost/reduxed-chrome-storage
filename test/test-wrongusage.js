import { expect } from 'chai';
import { createStore } from 'redux';

import reduxedStorageCreatorFactory from '../src';
import chrome from './mock/chrome.js';

describe('Wrong Usage', () => {

  describe('Factory', () => {

    it('if createStore parameter is missing, should throw an exception', () => {
      expect(() => {
        reduxedStorageCreatorFactory({});
      }).to.throw('createStore');
    });

    it('if chrome parameter is missing, should throw an exception', () => {
      expect(() => {
        reduxedStorageCreatorFactory({createStore});
      }).to.throw('chrome');
    });

  });

  describe('Store creator', () => {

    it('if reducer parameter is missing, should throw an exception', () => {
      expect(() => {
        reduxedStorageCreatorFactory({createStore, chrome})();
      }).to.throw('reducer');
    });

  });

});
