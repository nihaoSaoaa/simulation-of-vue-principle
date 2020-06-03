import Compiler from './compiler.js'
import { Observer } from './observer.js'

export class MVVM {
  constructor({
    el,
    data,
    methods
  }) {
    this.data = data;
    this.methods = methods;
    Object.keys(data).forEach( key => {
      this.proxyKeys(key);
    } )
    new Observer(this.data);
    new Compiler(el, this);
  }

  proxyKeys(key) {
    Object.defineProperty(this, key, {
      enumerable: false,
      configurable: true,
      get() {
          return this.data[key];
      },
      set(newVal) {
          this.data[key] = newVal;
      }
    });
  }
}