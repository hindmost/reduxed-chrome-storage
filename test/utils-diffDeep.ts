import { expect } from 'chai';
import { diffDeep } from '../src/utils';

describe('[utils/] diffDeep() function', () => {
  const obj = {
    one: 1,
    two: "two",
    three: {
      id: 1,
      value: 500
    },
    four: [2, 3, 4]
  };

  it("diffDeep(object, other_object) = deep difference between object and other_object", async () => {
    const otherObj = {
      one: 1,
      two: "two",
      three: {
        id: 1,
        value: 700
      },
      four: [2, 3, 5]
    };
    const ret = diffDeep(obj, otherObj);
    const diff = {
      three: {
        value: 500
      },
      four: [2, 3, 4]
    }
    expect(ret).to.eql(diff);
  });

  it("diffDeep(object, same_as_object) = undefined", async () => {
    const sameAsObj = {
      one: 1,
      two: "two",
      three: {
        id: 1,
        value: 500
      },
      four: [2, 3, 4]
    };
    const ret = diffDeep(obj, sameAsObj);
    expect(ret).to.eql(undefined);
  });

});
