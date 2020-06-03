import { isString, isObject, isArray, isFunction} from './util'

export const mapState = normalizeNamespace((namespace, states) => {
  const res = {}
  normalizeMap(states).forEach(({ key, val }) => {
    res[key] = function () {
      let state = this.$store.state;
      let getters = this.$store.getters;
      if (namespace) {
        const localModule = getModuleByNamespace(this.$store, 'mapState', namespace);
        if (localModule) {
          state = localModule.context.state;
          getters = localModule.context.getters;
        }
      }
      return  isFunction(val) ? 
        val.call(this, state, getters) : 
        state[val];
    }
  });
  return res;
})

export const mapGetters = normalizeNamespace((namespace, getters) => {
  const res = {};
  normalizeMap(getters).forEach(({ key, val }) => {
    res[key] = function () {
      val = namespace + val;
      // 不存在该模块
      if (namespace && !getModuleByNamespace(this.$store, 'mapGetters', namespace)) return
      // 不存在 该 getter
      if (!(val in this.$store.getters) ) {
        console.error(`[vuex] unkown getter: ${val}`);
        return;
      }
      return this.$store.getters[val];
    }
  });
  return res
})

export const mapMutations = normalizeNamespace((namespace, mutations) => {
  const res = {}
  normalizeMap(mutations).forEach(({ key, val }) => {
    res[key] = function (...args) {
      let commit = this.$store.commit;
      if (namespace) {
        const localModule = getModuleByNamespace(this.$store, 'mapMutations', namespace)
        if (localModule) {
          commit = localModule.context.commit;         
        }
      }
      commit.call(this.$store, val, ...args);
    } 
  })
  return res
})

export const mapActions = normalizeNamespace((namespace, actions) => {
  const res = {}
  normalizeMap(actions).forEach(({ key, val }) => {
    res[key] = function (...args) {
      let dispatch = this.$store.dispatch;
      if (namespace) {
        const localModule = getModuleByNamespace(this.$store, 'mapActions', namespace)
        if (localModule) {
          dispatch = localModule.context.dispatch;         
        }
      }
      dispatch.call(this.$store, val, ...args);
    } 
  })
  return res
})


/**
 * 标准化命名空间
 * @param {Function} fn 处理函数
 * @returns {Function} map 函数
 */
function normalizeNamespace(fn) {
  return (namespace, map) => {
    if (!isString(namespace)) {
      map = namespace;
      namespace = '';
    } else if (!namespace.endsWith('/')) {
      namespace += '/';
    }
    return fn(namespace, map)
  }
}

/**
 * 标准化 map
 * @param {Array|Object} map 
 */
function normalizeMap(map) {
  if (isValidMap(map)) {
    return isArray(map) ? 
      map.map(key => ({ key, val: key })) :
      Object.keys(map).map(key => ( { key, val: map[key] }) )
  }
}

/** 
 * 校验 map
*/
function isValidMap(map) {
  return isObject(map) || isArray(map);
}

function getModuleByNamespace(store, helper, namespace) {
  const module = store._modulesNamespaceMap[namespace];
  if (!module) {
    console.error(`[vuex] module namespace nout found in ${helper}(): ${namespace}`);
  }
  return module;
}