import Watcher from './watcher.js'

export default class Compiler {
  constructor(el, vm) {
    this.el = document.querySelector(el);
    this.vm = vm;
    this.fragment = null;
    this.init();
  }

  // 将 dom 转化为片段解析，为响应式的数据创建 watcher
  init() {
    if (this.el) {
      this.fragment = this.nodeToFragment(this.el);
      this.compile(this.fragment);
      this.el.appendChild(this.fragment);
    } else {
      throw new Error('dom不存在')
    }
  }

  // 获取 dom 内片段
  nodeToFragment(el) {
    const fragment = document.createDocumentFragment();
    let child = el.firstChild;
    while(child) {
      fragment.appendChild(child);
      child = el.firstChild;
    }
    return fragment;
  }

  // 编译片段
  compile(el) {
    const childNodes = el.childNodes;
    Array.prototype.slice.call(childNodes).forEach( node => {
      const reg = /\{\{(.*)\}\}/;
      const text = node.textContent;
      // 根据节点类型来创建 watcher
      if (this.isElementNode(node)) {
        this.compileElement(node)
      } else if (this.isTextNode(node) && reg.test(text)) {
        this.compileText(node, reg.exec(text)[1]);
      }
      if (node.childNodes && node.childNodes.length) {
        this.compile(node)
      }
    });
  }

  // 编译 指令匹配的属性
  compileElement(node) {
    const attrs = node.attributes;
    Array.prototype.slice.call(attrs).forEach( attr => {
      const attrName = attr.name;
      if (this.isDirective(attrName)) {
        const exp = attr.value;
        const dir = attrName.substring(2);
        if (this.isEventDirective(dir)) {
          this.compileEvent(node, exp, dir)
        } else {
          this.compileModel(node, exp, dir)
        }
        node.removeAttribute(attrName);
      }
    } )
  }

  compileEvent(node, exp, dir) {
    const method = this.vm.methods && this.vm.methods[exp];
    const eventType = dir.split(':')[1];
    if (eventType && method) {
      node.addEventListener(eventType, (e) => {
        method.call(this.vm, e);
      }, false);
    }
  }

  compileModel(node, exp, dir) {
    const initVal = this.vm[exp];
    this.updateModel(node, initVal);
    new Watcher(this.vm, exp, value => {
      this.updateModel(node, value)
    })

    node.addEventListener('input', (e) => {
      const newValue = e.target.value;
      if (initVal === newValue) return;
      this.vm[exp] = newValue;
    }, false)
  }

  // 编译 {{}} 匹配的文本
  compileText(node, exp) {
    const initText = this.vm[exp];
    this.updateText(node, initText);
    new Watcher(this.vm, exp, value => {
      this.updateText(node, value);
    } )
  }

  updateText(node, newText) {
    node.textContent = typeof newText === 'undefined' ? '' : newText;
  }
  updateModel(node, newValue) {
    node.value = typeof newValue === 'undefined' ? '' : newValue;
  }
  isDirective(attrName) {
    return attrName.indexOf('v-') === 0;
  }
  isEventDirective(dir) {
    return dir.indexOf('on:') === 0; 
  }
  isElementNode(node) {
    return node.nodeType == 1;
  }
  isTextNode(node) {
    return node.nodeType === 3;
  }


}