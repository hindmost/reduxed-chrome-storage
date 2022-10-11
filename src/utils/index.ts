/**
 * Utility function: returns a deep copy of its argument
 */
function cloneDeep(o: any): any {
  return o == null || typeof o !== 'object' ?
    o :
    JSON.parse(JSON.stringify(o));
}

/**
 * Utility function: checks deeply if its two arguments are equal
 */
function isEqual(a: any, b: any): boolean {
  if (a === b)
    return true;
  if (a == null || typeof a !== 'object' ||
      b == null || typeof b !== 'object' ||
      Array.isArray(a) !== Array.isArray(b) )
    return false;
  const keysA = Object.keys(a), keysB = Object.keys(b);
  if (keysA.length !== keysB.length)
    return false;
  for (const key of keysA) {
    if (keysB.indexOf(key) <= -1 || !isEqual(a[key], b[key]))
      return false;
  }
  return true;
}

/**
 * Utility function: returns the deep difference between its two arguments
 */
function diffDeep(a: any, b: any): any {
  if (a === b)
    return undefined;
  if (a == null || typeof a !== 'object' ||
      b == null || typeof b !== 'object' )
    return a;
  if (Array.isArray(a) || Array.isArray(b))
    return isEqual(a, b)? undefined : a;
  const keysA = Object.keys(a), keysB = Object.keys(b);
  let eq = true;
  const ret = keysA.reduce( (acc: any, key) => {
    const diff = keysB.indexOf(key) > -1? diffDeep(a[key], b[key]) : a[key];
    if (typeof diff === 'undefined')
      return acc;
    eq = false;
    acc[key] = diff;
    return acc;
  }, {});
  keysB.forEach( key => {
    if (keysA.indexOf(key) > -1)
      return;
    eq = false;
    ret[key] = undefined;
  });
  return eq? undefined : ret;
}

function mergeOrReplace(a: any, b: any, withReduction?: boolean): any {
  if (Array.isArray(b))
    return cloneDeep(b);
  if (a == null || typeof a !== 'object' || Array.isArray(a) ||
      b == null || typeof b !== 'object')
    return cloneDeep(typeof b !== 'undefined'? b : a);
  const ret = Object.keys(a).concat(
      Object.keys(b).filter(key => !(key in a))
    ).reduce((acc: any, key) => {
      return acc[key] = mergeOrReplace(a[key], b[key], withReduction), acc
    }, {});
  if (!withReduction)
    return ret;
  const keysB = Object.keys(b);
  Object.keys(a).forEach( key => {
    keysB.indexOf(key) > -1 || delete ret[key];
  });
  return ret;
}

export { cloneDeep, isEqual, diffDeep, mergeOrReplace }
