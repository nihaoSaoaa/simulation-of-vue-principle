import Module from './module'
import { forEachValue } from '../util'

export default function ModuleCollection(rawRootModule) {
  this.register([], rawRootModule);
}

/**
 * @description '注册模块'
 * @param { Array<string> } path 
 * @param { Object } rawModule
 */
ModuleCollection.prototype.register = function (path, rawModule) {
  // 创建模块
  const module = new Module(rawModule);
  // 注册模块
  // 如果是根模块
  if (path.length === 0) {
    this.root = module;
  } else {
    // 不是根路径 1. 获取父模块
    const fatherPath = path.slice(0, -1);
    const parent = this.get(fatherPath);
    // 获取模块名
    const moduleName = path[path.length - 1];
    parent._children[moduleName] = module; 
  }
  // 存在子模块时递归注册
  if (rawModule.modules) {
    forEachValue(rawModule.modules, (rawChildModule, moduleName) => {
      this.register(path.concat(moduleName), rawChildModule);
    })
  }
}
/**
 * @description '获取模块'
 * @param { Array<string> } path
 */
ModuleCollection.prototype.get = function(path) {
  return path.reduce((module, key) => {
    return module.getChild(key);
  }, this.root)
}

/**
 * @description 获取命名空间
 * @param { Array<String> } path 路径数组
 * @returns { String } 命名空间
 */
ModuleCollection.prototype.getNamespace = function(path) {
  let module = this.root;
  return path.reduce((namespace, key) => {
    module = module.getChild(key);
    return (module._namespaced) ? namespace + key + '/': namespace; 
  }, '')
}