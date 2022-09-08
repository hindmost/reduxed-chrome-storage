import { expect } from 'chai';

import { setupReduxed } from '../src';

describe('Wrong Usage', () => {

  it('if the argument for storeCreatorContainer is missing, should throw an exception', () => {
    expect(() => {
      // @ts-expect-error throw
      setupReduxed();
    }).to.throw('Missing');
  });

});
