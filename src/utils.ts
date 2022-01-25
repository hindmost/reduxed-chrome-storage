export function cloneDeep(o: any): any {
  if (o == null || typeof o !== 'object')
    return o;
  if (Array.isArray(o))
    return o.map(v => cloneDeep(v));
  return Object.keys(o).reduce((acc: any, key) => {
    return acc[key] = cloneDeep(o[key]), acc
    }, {});
}

export function isEqual(a: any, b: any): boolean {
  if (a === b)
    return true;
  if (a == null || typeof a !== 'object' ||
      b == null || typeof b !== 'object')
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

export function mergeOrReplace(a: any, b: any): any {
  if (Array.isArray(b))
    return cloneDeep(b);
  if (a == null || typeof a !== 'object' || Array.isArray(a) ||
      b == null || typeof b !== 'object')
    return typeof b !== 'undefined'? b : a;
  return Object.keys(a).concat(
      Object.keys(b).filter(key => !(key in a))
    ).reduce((acc: any, key) => {
      return acc[key] = mergeOrReplace(a[key], b[key]), acc
    }, {});
}
