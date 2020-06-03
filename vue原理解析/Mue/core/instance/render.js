import { changeText } from '../util/elmFunc.js'
import { getValue } from '../util/objectFunc.js'

const vnode2Template = new Map();
const template2vnode = new Map();

export function renderMixin(Due) {
  Due.prototype._render = function () {
    renderNode(this, this._vnode);
  }
}

export function renderNode(vm, vnode) {
  if (vnode.nodeType === 3) {
    const templateSet = vnode2Template.get(vnode);
    if (templateSet) {
      let result = vnode.text;
      templateSet.forEach(template => {
        const value = getValue(Object.assign({}, vm._data, vnode.env), template);
        if (value) result = result.replace(`{{${template}}}`, value);
      })
      // 修改节点文本
      changeText(vnode.elm, result);
    }
  } else if (vnode.nodeType === 1) {
    for (let i = 0; i < vnode.children.length; i++) {
      const childVNode = vnode.children[i];
      renderNode(vm, childVNode);
    }
  }
}

export function renderData(vm, data) {
  const vnodeSet = template2vnode.get(data);
  if (vnodeSet) {
    vnodeSet.forEach(vnode => {
      renderNode(vm, vnode);
    })
  }
}

export function prepareRender(vm, vnode) {
  if (vnode === null) {
    return;
  } else if (vnode.nodeType === 1) {
    for (let i = 0; i < vnode.children.length; i++) {
      const childVNode = vnode.children[i];
      prepareRender(vm, childVNode);
    }
  } else if (vnode.nodeType === 3) {
    analysisTemplateSiring(vnode);
  }
}
// 解析模板字符串
function analysisTemplateSiring(vnode) {
  const templateStrList = vnode.text.match(/{{[a-zA-Z0-9_.]+}}/g);
  templateStrList && templateStrList.forEach(template => {
    setTemplate2vnode(template, vnode);
    setVnode2Template(template, vnode);
  })
}
// 设置template与vnode的映射关系
function setTemplate2vnode(template, vnode) {
  const templateName = getTempalteName(template);
  let vnodeSet = template2vnode.get(templateName);
  if (vnodeSet) {
    vnodeSet.add(vnode)
  } else {
    template2vnode.set(templateName, vnodeSet = new Set([vnode]));
  }
}

function setVnode2Template(template, vnode) {
  const templateName = getTempalteName(template);
  let templateSet = vnode2Template.get(vnode);
  if (templateSet) {
    templateSet.add(templateName)
  } else {
    vnode2Template.set(vnode, templateSet = new Set([templateName]));
  }
}
// 获取template名称
function getTempalteName(template) {
  const len = template.length;
  if (template.substring(0, 2) === '{{' && template.substring(len - 2, len) === "}}") {
    return template.substring(2, len - 2);
  } else {
    return template;
  }
}