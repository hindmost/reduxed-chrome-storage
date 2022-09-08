import { expect } from 'chai';
import { mergeOrReplace } from '../src/utils';

describe('[utils/] mergeOrReplace() function', () => {
  const obj1 = {
    key: null
  };
  const obj2 = {
    key: {p: 2}
  };

  it("mergeOrReplace one object containing null under specific key with another object containing nested object under the same key. It should run without error", async () => {
    const ret = mergeOrReplace(obj1, obj2);
    expect(ret).to.eql(obj2);
  });

});
