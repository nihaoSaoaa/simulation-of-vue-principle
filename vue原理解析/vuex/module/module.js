import { forEachValue } from '../util'
export default function Module(rawModule) {
  const { state = {}, modules = {}, namespaced = false} = rawModule;
  this.state = state;
  this._children = modules;
  this._rawModule = rawModule;
  this._namespaced = namespaced;
}

Module.prototype.getChild = function(key) {
  return this._children[key];
}

Module.prototype.forEachChild = function(handle) {
  forEachValue(this._children, (childModule, moduleName) => {
    handle(childModule, moduleName)
  });
}

Module.prototype.forEachGetter = function(handle) {
  forEachValue(this._rawModule.getters, (getter, getterName) => {
    handle(getter, getterName);
  })
}

Module.prototype.forEachMutation = function(handle) {
  forEachValue(this._rawModule.mutations, (mutation, mutationName) => {
    handle(mutation, mutationName);
  })
}

Module.prototype.forEachAction = function(handle) {
  forEachValue(this._rawModule.actions, (action, actionName) => {
    handle(action, actionName);
  })
}