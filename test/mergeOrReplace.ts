import { expect } from 'chai';
import { mergeOrReplace, cloneDeep } from '../src/utils';

function oldMergeOrReplace(a: any, b: any): any {
  if (Array.isArray(b))
    return cloneDeep(b);
  if (typeof a !== 'object' || Array.isArray(a) || typeof b !== 'object')
    return typeof b !== 'undefined'? b : a;
  return Object.keys(a).concat(
      Object.keys(b).filter(key => !a[key])
    ).reduce((acc: any, key) => {
      return acc[key] = oldMergeOrReplace(a[key], b[key]), acc
    }, {});
}

describe('mergeOrReplace() function', () => {
  const obj1 = {
    key: null
  };
  const obj2 = {
    key: {p: 2}
  };

  it("Using old version of mergeOrReplace(): merge one object containing null under specific key with another object containing nested object under the same key. It should throw an error", async () => {
    expect(() => {
      oldMergeOrReplace(obj1, obj2);
    }).to.throw();
  });

  it("Using new version of mergeOrReplace(): merge one object containing null under specific key with another object containing nested object under the same key. It should run without error", async () => {
    const ret = mergeOrReplace(obj1, obj2);
    expect(ret).to.eql(obj2);
  });

});
