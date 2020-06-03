/**
 * 遍历对象
 * @param {Object} obj 
 * @param { Function } handle 
 */
export function forEachValue(obj, handle) {
  Object.keys(obj).forEach(key => {
    handle(obj[key], key);
  })
}

export function isObject(obj) {
  return typeof obj === 'object' && obj !== null;
}

export function isPromise(val) {
  return val && typeof val.then === 'function';
}

export function isArray(val) {
  return Array.isArray(val);
}

export function isString(val) {
  return typeof val === 'string';
}

export function isFunction(val) {
  return typeof val === 'function';
}