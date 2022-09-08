import { expect } from 'chai';
import { isEqual } from '../src/utils';

describe('[utils/] isEqual() function', () => {
  const obj = {
    one: 1,
    two: "two",
    three: {
      id: 1,
      value: 500
    },
    four: [2, 3, 4]
  };

  it("isEqual(object, same_as_object) = true", async () => {
    const sameAsObj = {
      one: 1,
      two: "two",
      three: {
        id: 1,
        value: 500
      },
      four: [2, 3, 4]
    };
    const ret = isEqual(obj, sameAsObj);
    expect(ret).to.eql(true);
  });

  it("isEqual(object, other_object) = false", async () => {
    const otherObj = {
      one: 1,
      two: "two",
      three: {
        id: 2,
        value: 500
      },
      four: [2, 3, 4]
    };
    const ret = isEqual(obj, otherObj);
    expect(ret).to.eql(false);
  });

  it("isEqual(array, array-like_object) = false", async () => {
    const arr = [
      'one', 'two', 'three'
    ];
    const arrLikeObj = {
      0: 'one', 1: 'two', 2: 'three'
    };
    const ret = isEqual(arr, arrLikeObj);
    expect(ret).to.eql(false);
  });

});
