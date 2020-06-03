// 1. 跨平台 API 的封装
// 2. API 的二次封装

const nodeOps = {
  setTextContent (text) {
      if (platform === 'weex') {
          node.parentNode.setAttr('value', text);
      } else if (platform === 'web') {
          node.textContent = text;
      }
  },
  parentNode () {
      //......
  },
  removeChild () {
      //......
  },
  nextSibling () {
      //......
  },
  insertBefore () {
      //......
  }
}


// 插入节点
function insert(parent, elm, ref) {
  if (parent) {
    if (ref) ref.parentNode === parent && nodeOps.insertBefore(parent, elm, ref)
    else nodeOps.appendChild(parent, elm)
  }
}

// 创建节点
function createElm(vNode, parentElm, refElm) {
  if (vNode.tag) insert(parentElm, nodeOps.createElement(vNode.tag), refElm); 
  if (vNode.text) insert(parentElm, nodeOps.createTextNode(vNode.text), refElm); 
}

// 批量创建节点
function addNodes(parentElm, refElm, vNodes, startInx, endInx) {
  while(startInx++ <= endInx) {
    createElm(vNodes[startInx], parentElm, refElm);
  }
}

// 删除节点
function removeNode(el) {
  const parent = nodeOps.parentNode(el);
  if (parent) nodeOps.removeChild(parent, el);
}
// 批量删除节点
function removeNodes(parentElm, vNodes, startInx, endInx) {
  while(startInx++ <= endInx) {
    const vNode = vNodes[startInx];
    if (vNode) nodeOps.removeNode(parentElm, vNode.elm);
  }
}


// patch 简化方法
function patch(oldVNode, vNode, parentElm) {
  if (!oldVNode) addNodes(parentElm, null, vNode, 0, vNode.length - 1);
  else if (!vNode) removeNodes(parentElm, oldVNode, 0, vNode.length - 1);
  else {
    if (sameVNode(oldVNode, vNode)) patchVNode(oldVNode, vNode);
    else {
      removeNodes(parentElm, oldVNode, 0, oldVNode.length - 1);
      addNodes(parentElm, null, VNode, 0, VNode.length - 1);
    } 
  }
}

function sameVNode () {
  return (
      a.key === b.key &&
      a.tag === b.tag &&
      a.isComment === b.isComment &&
      (!!a.data) === (!!b.data) &&
      sameInputType(a, b)
  )
}

function sameInputType (a, b) {
  if (a.tag !== 'input') return true
  let i
  const typeA = (i = a.data) && (i = i.attrs) && i.type
  const typeB = (i = b.data) && (i = i.attrs) && i.type
  return typeA === typeB
}

// 对比虚拟节点以更新视图(整合的API)
/**
 * 1. 新老 VNode 节点相同
 * 2. 新老 VNode 节点都是 isStatic（静态的），并且 key 相同时
 * 3. 新 VNode 节点是文本节点
 * 4.1 oldCh 与 ch 都存在且不相同时，使用 updateChildren 函数来更新子节点
 * 4.2 有 ch 存在的时候，如果老节点是文本节点则先将节点的文本清除，然后将 ch 批量插入插入到节点elm下。
 * 4.3 只有 oldch 存在时，说明需要将老节点通过 removeVnodes 全部清除。
 * 4.4 只有老节点是文本节点的时候，清除其节点文本内容
 */
function patchVNode(oldVNode, vNode) {
  if (oldVNode === vNode) return;
  if (vNode.isStatic && oldVNode.isStatic && vNode.key === oldVNode.key) {
    vNode.elm = oldVNode.elm;
    vNode.componentInstance = oldVNode.componentInstance;
    return;
  }
  // 保存 真实 DOM ，对比后删除老节点
  const elm = vNode.elm = oldVNode.elm;
  const oldCh = oldVNode.children;
  const ch = vNode.children;

  if (vNode.text) nodeOps.setTextContent(elm, vNode.text);
  else {
    if (oldCh && ch && (oldCh !== ch)) updateChildren(elm, oldCh, ch);
    else if (ch && oldVNode.text) {
      nodeOps.setTextContent(elm, '');
      addNodes(elm, null, ch, 0, ch.length - 1)
    }
    else if (oldCh) removeNodes(elm, oldCh, 0, oldCh.length - 1)
    else if (oldVNode.text) nodeOps.setTextContent(elm, 0);
  }

}

function updateChildren(elm, oldCh, ch) {
  
}