export default class VNode {
  constructor (
    tag,  // 标签名
    data, // 数据信息，例如 props、attrs
    children, // 子节点数组
    text, // 文本节点
    elm, //对应的真实dom
    parent, //  父节点
    nodeType // 节点类型
    ) {
    this.tag = tag;
    this.data = data;
    this.children = children;
    this.text = text;
    this.elm = elm;
    this.parent = parent;
    this.nodeType = nodeType;
    this.env = {}; // 环境变量
    this.instructions = null; // 存放指令
    this.template = []; // 当前节点涉及的模板
  }
}