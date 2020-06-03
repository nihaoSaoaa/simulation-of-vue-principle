// 订阅者

import { Dep }  from './observer.js'

export default  class Watcher {
  constructor(vm, exp, cb) {
    this.vm = vm; // Vue实例W
    this.exp = exp; // 指令或插值的属性
    this.cb = cb;  // 绑定的更新函数
    this.value = this.get(); // 将自己添加到订阅器并且储存起来
  }

  update() {
    this.run();
  }
  run() {
    const value = this.vm[this.exp];  //更新时获取新的值
    const oldValue = this.value;
    if (value != oldValue) {
      this.value = value;
      this.cb.call(this.vm, value, oldValue);
    }
  }

  get() {
    Dep.target = this;
    const value = this.vm[this.exp]  //主动触发 get 进行依赖收集
    Dep.target = null;
    return value;
  }
}
