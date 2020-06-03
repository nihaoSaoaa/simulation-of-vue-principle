import applyMixin from './mixin'
import ModuleCollection from './module/module-collection'
import { forEachValue, isObject, isPromise } from './util'

/**
 * 2. 将各个模块上的getters都统一的放到store上，无论是root上的还是其他子模块上
 * 2.1 创建 _wrappedGetters ，统一管理 getters
 * 2.2 通过_wrappedGetters 得到 this.getters
 * 2.3 getters应该是vm上的计算属性
 * 2.4 若在 options 里配置了命名空间
 *  2.4.1 getter 中的属性名字前面需要加上 模块的名字
 *  2.4.2 getter 函数接收的参数有改变，分别是 本模块的state，本模块的getters，根模块的state，根模块的getters
 */

/**
  * 3. 将各个模块上的 mutations 都统一的放到store上，无论是root上的还是其他子模块上
  * 3.1 创建 _mutations ，统一管理 mutations
  * 3.2 命名空间
  * 3.3 实现 store 实例方法 commit
  * 3.4 严格模式下，通过 vue 实例方法 $watch 监听 state 爆出错误
  */

/**
 * 4. 统一 actions
 * 4.1 创建_actions，统一管理 actions,且 actions 函数都要返回 一个 promise
 * 4.2 命名空间
 * 4.3 实现 dispatch 方法
 * 4.4  如果一个模块拥有命名空间，那么它内部的action函数，在1）提交mutation； 2）分发其他action时，不需要再type前加上命名空间
 */

let Vue;

export function install(_Vue) {
  Vue = _Vue;
  // 初始化 store
  applyMixin(Vue);
}

export function Store(options) {
  this._wrappedGetters = {};  
  this._makeLocalGetterCache = {};  // getter 缓存
  this._mutations = {};
  this._actions = {};
  this._isCommitting = false;
  this.strict = !!options.strict;

  this._modulesNamespaceMap = {};

  // 绑定 dispatch / commit 的 this指向
  const store = this;
  const { dispatch, commit } = this;
  this.dispatch = function(type, payload) {
    return dispatch.call(store, type, payload)
  }
  this.commit = function(type, payload) {
    return commit.call(store, type, payload)
  }

  // 创建模块
  this._modules = new ModuleCollection(options);
  // 安装模块-- 完善 state + getters
  const rootState = this._modules.root.state;
  installModule(this, rootState, [], this._modules.root);
  // 重置 store 的 vm 实例
  resetStoreVM(this, rootState)

  
}

Store.prototype.dispatch = function(type, payload) {
  const { type: _type, payload: _payload } = unifyObjectStyle(type, payload);
  const entry = this._actions[_type];
  if (entry) {
    const result = entry.length > 1 ? 
      Promise.all(entry.map(handle => handle(_payload))) :
      entry[0](payload);
    return result;
  }
}

Store.prototype.commit = function(type, payload) {
  const { type: _type, payload: _payload } = unifyObjectStyle(type, payload);
  const entry = this._mutations[_type];
  this._withCommit(() => {
    entry.forEach(handle => handle(_payload));
  })
}
Store.prototype._withCommit = function(fn) {
  const isCommitting = this._isCommitting;
  this._isCommitting = true;
  fn();
  this._isCommitting = isCommitting;
}



/**
 * 安装模块
 * @param { Store } store store实例
 * @param { Object } rootState 根状态
 * @param { Array<String> } path 状态路径
 * @param { Module } module 状态模块
 */
function installModule(store, rootState, path, module) {
  if (path.length !== 0) {
    const parentState = getNestedState(rootState, path.slice(0, -1));
    const moduleName = path[path.length - 1];
    // 让父状态里有同名句柄指向子状态
    parentState[moduleName] = module.state;
  }

  // 2.4.1 获取命名空间
  const namespace = store._modules.getNamespace(path);

  // 2.4.2 创建本地上下文指针
  const local = module.context =  makeLocalContext(store, namespace, path);
  
  // 5 收集有命名空间的模块
  if (module._namespaced) {
    store._modulesNamespaceMap[namespace] = module;
  }

  // 2.1 循环遍历 module 的 getters，注册 _wrappedGetters
  if (module._rawModule.getters) {
    module.forEachGetter((getter, getterName) => {
      const type = namespace + getterName;
      registerGetter(store, type, getter, local);
    })
  }

  // 3.1 循环遍历 module 的 mutations，注册 _mutations
  if (module._rawModule.mutations) {
    module.forEachMutation((mutation, mutationName) => {
      const type = namespace + mutationName;
      registerMutation(store, type, mutation, local);
    })
  }

  if (module._rawModule.actions) {
    module.forEachAction((action, actionName) => {
      const type = namespace + actionName;
      registerAction(store, type, action, local);
    })
  }

  // 遍历子模块
  module.forEachChild((childModule, moduleName) => {
    installModule(store, rootState, path.concat(moduleName), childModule)
  })
}

/**
 * 获取路劲对应的state
 * @param { Object } state 根模块数据 
 * @param { Array<String> } path 路径 
 */
function getNestedState(state, path) {
  return path.reduce((state, moduleName) => {
    return state[moduleName];
  }, state)
}

/**
 * @description 注册 _wrappedGetters
 * @param { store } store 
 * @param { string } getterName 
 * @param { Function } getter 
 * @param { Object } local
 */
function registerGetter(store, type, getter, local) {
  store._wrappedGetters[type] = function (store) {
    return getter(local.state, local.getters, store.state, store.getters);
  } 
}

/**
 * @description 注册 _mutations
 * @param { store } store 
 * @param { string } getterName 
 * @param { Function } mutation 
 * @param { Object } local
 */
function registerMutation(store, type, mutation, local) {
  const entry = store._mutations[type] || (store._mutations[type] = []);
  entry.push((payload) => {
    mutation.call(store, local.state, payload)
  })
}

function registerAction(store, type, action, local) {
  const entry = store._actions[type] || (store._actions[type] = []);
  entry.push((payload) => {
    let result =  action.call(store, {
      commit: local.commit,
      dispatch: local.dispatch,
      state: local.state,
      getters: local.getters,
      rootState: store.state,
      rootGetters: store.getters
    }, payload)
    if (!isPromise(result)) {
      result = Promise.resolve(result)
    }
    return result;
  })
}


/**
 * @description 重置 store vm
 * @param { store } store 
 * @param { Object } state 
 */
function resetStoreVM(store, state) {
  const computed = {};
  store.getters = {};
  // 2.2 注册 computed
  const wrappedGetters = store._wrappedGetters;
  forEachValue(wrappedGetters, (wrappedGetter, getterName) => {
    computed[getterName] = function () {
      return wrappedGetter(store);
    }
    Object.defineProperty(store.getters, getterName, {
      get() {
        return store._vm[getterName];
      },
      enumerable: true
    })
  })
  store._vm = new Vue({
    data: {
      state,
    },
    computed
  })
  // 3.4 严格模式 警告
  if (store.strict) {
    enableStrictMode(store)
  }
  Object.defineProperty(store, 'state', {
    get() {
      return store._vm.state;
    },
    enumerable: true
  })  
}

/**
 * 创建命名空间上下文
 * @param { store } store 
 * @param { string } namespace 
 * @param { Array<string> } path 
 */
function makeLocalContext(store, namespace, path) {
  const NONamespace = namespace === '';
  const context = {
    commit: (NONamespace) ? store.commit : (type, payload) => {
      let {type:_type, payload: _payload} = unifyObjectStyle(type, payload);
      _type = namespace + _type;
      store.commit(_type, _payload);
    },
    dispatch: (NONamespace) ? store.dispatch : (type, payload) => {
      let {type:_type, payload: _payload} = unifyObjectStyle(type, payload);
      _type = namespace + _type;
      store.dispatch(_type, _payload);
    },
  };
  Object.defineProperties(context, {
    state: {
      get() {
        return getNestedState(store.state, path)
      },
      enumerable: true
    },
    getters: {
      get() {
        return (!NONamespace) ? makeLocalGetters(store, namespace) : store.getters;
      }
    }
  })
  return context;
}
/**
 * 获取对应命名空间下的所有 getters
 * @param {*} store 
 * @param {*} namespace 
 */
function makeLocalGetters(store, namespace) {

  const splitPos = namespace.length;
  const getterProxy = {};
  // 判断缓存是否存在
  if (!store._makeLocalGetterCache[namespace]) {
    Object.keys(store.getters).forEach(getterName => {
      if(getterName.slice(0, splitPos) !== namespace)  return ;
      const localType = getterName.slice(splitPos);
      Object.defineProperty(getterProxy, localType, {
        get: () => store.getters[getterName],
        enumerable: true,
      })
    });
    store._makeLocalGetterCache[namespace] = getterProxy;
  }
  
  return store._makeLocalGetterCache[namespace];
}

/**
 * 整合 commit 方法的参数
 * @param { Object | string } type 
 * @param { string ? } payload 
 */
function unifyObjectStyle(type, payload) {
  if (isObject(type)) {
    payload = type;
    type = type.type;
  }
  return {
    type,
    payload
  }
}

/**
 * @description 启动严格模式 ---- 必须使用 commit 提交 mutation
 * @param store 
 */
function enableStrictMode(store) {
  store._vm.$watch(function () {
    return this.state
  }, () => {
    if (!store._isCommitting) {
      throw new Error(`[vuex] do not mutate vuex store state outside mutation handlers.`)
    }
  }, {
    deep: true,
    sync: true
  })
}