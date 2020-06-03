import VNode from '../vdom/VNode.js'
import { prepareRender, renderNode, renderMixin } from './render.js'
import { vmodel } from '../directive/index.js'

export function initMount(Mue) {
  Mue.prototype.$mount = function (el) {
    let vm = this;
    let rootDom = document.querySelector(el);
    mount(vm, rootDom);
  }
  renderMixin(Mue);
}

export function mount(vm, elm) {
  // 进行挂载
  vm._vnode = constructVNode(vm, elm, null);
  // 进行预备渲染,建立索引
  prepareRender(vm, vm._vnode);
  renderNode(vm, vm._vnode);
}

function constructVNode(vm, elm, parent) {
  analysisAttr(vm, elm, parent);
  const tag = elm.nodeName;
  const data = {};
  const children = [];
  const text = getNodeText(elm);
  const nodeType = elm.nodeType;
  const vnode = new VNode(tag, data, children, text, elm, parent, nodeType);

  const childs = vnode.elm.childNodes;
  for (let i = 0; i < childs.length; i++) {
    const child = childs[i];
    const childVNode = constructVNode(vm, child, vnode);
    if (childVNode instanceof VNode) {
      vnode.children.push(childVNode);
    } else {
      vnode.children.push(...childVNode);
    }
  }
  return vnode;
}
// 获取节点文本
function getNodeText(elm) {
  if (elm.nodeType === 3) {
    return elm.nodeValue;
  } else {
    return '';
  }
}
// 分析节点
function analysisAttr(vm, elm, parent) {
  if (elm.nodeType === 1) {
    const attrs = elm.getAttributeNames();
    // 当属性包含 ‘v-model’
    if (attrs.includes('v-model')) {
      vmodel(vm, elm, elm.getAttribute('v-model'))
    }
  }
}