import { expect } from 'chai';
import { mergeOrReplace } from '../src/utils';

describe('[utils/] mergeOrReplace() function', () => {
  const obj = {
    one: 1,
    two: "two",
    three: {
      id: 1,
      value: 500
    },
    four: [2, 3, 4]
  };
  const reducedObj = {
    one: 1,
    two: "two",
    three: {
      id: 1,
    }
  };

  it("mergeOrReplace(object, reduced_object) = object", async () => {
    const ret = mergeOrReplace(obj, reducedObj);
    expect(ret).to.eql(obj);
  });

  it("mergeOrReplace(object, reduced_object, true) = reduced_object", async () => {
    const ret = mergeOrReplace(obj, reducedObj, true);
    expect(ret).to.eql(reducedObj);
  });

  it("mergeOrReplace(object, other_object) = other_object", async () => {
    const otherObj = {
      one: 0,
      two: {
        id: 1,
        value: 500
      },
      three: "three",
      four: [2, 3, 5]
    };
    const ret = mergeOrReplace(obj, otherObj);
    expect(ret).to.eql(otherObj);
    ret.two = 2;
    expect(ret).to.not.eql(otherObj);
  });

  it("mergeOrReplace(object_with_null, object_with_nested_object) = object_with_nested_object", async () => {
    const objWithNull = {
      key: null
    };
    const objWithNestedObj = {
      key: {p: 2}
    };
    const ret = mergeOrReplace(objWithNull, objWithNestedObj);
    expect(ret).to.eql(objWithNestedObj);
  });

});
