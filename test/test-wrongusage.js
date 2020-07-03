import { expect } from 'chai';
import { createStore } from 'redux';

import chrome from './mock/chrome.js';
import reduxedStorageCreatorFactory from '../src';
global.chrome = chrome;

describe('Wrong Usage', () => {

  describe('Factory', () => {

    it('if createStore parameter is missing, should throw an exception', () => {
      expect(() => {
        reduxedStorageCreatorFactory({});
      }).to.throw('createStore');
    });

  });

  describe('Store creator', () => {

    it('if reducer parameter is missing, should throw an exception', () => {
      expect(() => {
        reduxedStorageCreatorFactory({createStore})();
      }).to.throw('reducer');
    });

  });

});
