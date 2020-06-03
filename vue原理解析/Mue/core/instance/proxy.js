import { isArray, isObject } from '../util/type.js'
import { renderData } from './render.js'

// 对对象进行代理
function constructObjProxy(vm, obj, namespace) {
  let proxyObj = {};
  for (const prop in obj) {
    let val = obj[prop];
    Object.defineProperty(proxyObj, prop, {
      enumerable: true,
      configurable: true,
      get() {
        return val;
      },
      set(newVal) {
        if (val === newVal) return;
        val = newVal;
        renderData(vm, getNamespace(namespace, prop));
      }
    })
    if (isArray(val) || isObject(val)) {
      proxyObj[prop] = constructProxy(vm, val, getNamespace(namespace, prop)) 
    }
  }
  
  return proxyObj;
}
// 对数组进行代理
function constructArrProxy(vm, arr, namespace) {
  const methods = ['push', 'pop', 'shift', 'unshift', 'splice', 'reverse', 'sort'];
  const arrProto = Array.prototype;
  const newProto = Object.create(arrProto);
  newProto.eleType = 'Array';
  methods.forEach(methodName => {
    defineArrFunc(vm, methodName, namespace, newProto);
  })
  Object.setPrototypeOf(arr, newProto);
  return arr;
}

function defineArrFunc(vm, methodName, namespace, obj) {
  const origin = obj[methodName];
  const mutationMethod = function (...args) {
    const result = origin.call(this,...args);
    console.log(getNamespace(namespace, ''));
    return result;
  }
  Object.defineProperty(obj, methodName, {
    enumerable: false,
    configurable: true,
    value: mutationMethod
  })
}

function getNamespace(namespace, prop) {
  if (namespace === null || namespace === '') return prop;
  else if (prop === '') return namespace;
  else return `${namespace}.${prop}`;
}

export function constructProxy(vm, obj, namespace) {
  let proxyObj = null;
  if (isArray(obj)) {
    proxyObj = new Array(obj.length);
    for (let i = 0; i < obj.length; i++) {
      const item = obj[i];
      if (isObject(item)) {
        item = constructProxy(vm, item, namespace);
      }
    }
    proxyObj = constructArrProxy(vm, obj, namespace);
  } else if (isObject(obj)) {
    proxyObj = constructObjProxy(vm, obj, namespace);
  } else {
    throw Error('data must be a object');
  }
  return proxyObj;
}

export function proxyToVm(vm) {
  Object.keys(vm._data).forEach(prop => {
    Object.defineProperty(vm, prop, {
      enumerable: true,
      configurable: true,
      get() {
        return vm._data[prop];
      },
      set(newVal) {
        vm._data[prop] = newVal;
      }
    })
  })
}