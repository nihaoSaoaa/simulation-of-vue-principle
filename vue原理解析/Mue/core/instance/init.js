import { constructProxy, proxyToVm } from './proxy.js'
import { mount, initMount } from './mount.js'

let uid = 0;

export function initMixin(Mue) {
  Mue.prototype._init = function (options) {
    const vm = this;
    vm.uid = uid ++;
    vm._isMue = true;
    // 初始化 data
    if (options && options.data) {
      vm._data = constructProxy(vm, options.data, '');
      proxyToVm(vm);
    }
    // 初始化el挂载
    if (options && options.el) {
      mount(vm, document.querySelector(options.el));
    }
    initMount(Mue);
  }
}