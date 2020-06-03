// 1. 多层代理通过 get 判断是不是对象进行按需递归
// 2 记录代理防止重复操作
// 3. SET 的两种情况：add，update不一样的数据
// 4. 依赖收集（变态版）

function reactive(target) {
  return createReactiveObject(target);
}


// 2.1 创建映射表
const toProxy = new WeakMap();
const toRow = new WeakMap();


function createReactiveObject(target) {
  if (!isObject(target)) return target;
  // 2.2 根据已有的映射关系直接返回代理对象
  const proxy = toProxy.get(target);
  if (proxy) return proxy;
  if (toRow.has(target)) return target;
  const baseHandler = {
    get(target, key, receiver) {
      const res = Reflect.get(target, key, receiver);
      // 4.2 依赖收集 将 key 和 effect 联系起来
      track(target, key); 

      // 1. 多层代理通过 get 判断是不是对象进行按需递归
      return isObject(res) ? reactive(res) : res;
    },
    set(target, key, value, receiver) {
      const hasKey = hasOwn(target, key);
      const oldValue = target[key];
      const hasSet =  Reflect.set(target, key, value, receiver);
      // 4.3  触发依赖函数
      if (!hasKey) trigger(target, 'add', key);
      else if (oldValue !== value) trigger(target, 'update', key);;
      return hasSet;
    },
    deleteProperty(target, key, receiver) {
      const hasDelete =  Reflect.deleteProperty(target, key, receiver);
      console.log(`delete:${hasDelete}`);
      return hasDelete;
    }
  }
  const observed =  new Proxy(target, baseHandler);
  // 2.3 添加映射
  toProxy.set(target, observed);
  toRow.set(observed, target);
  return observed;
}

// 4.1 响应式函数
const activeEffectStacks = [];

const targetMap = new WeakMap();

function track(target, key) {
  const effect = activeEffectStacks[activeEffectStacks.length - 1];
  if (effect) {
    let depsMap = targetMap.get(target);
    if (!depsMap) targetMap.set(target, depsMap = new Map());
    let deps = depsMap.get(key);
    if (!deps) depsMap.set(key, deps = new Set());
    deps.add(effect);
  }
}

function trigger(target, type, key) {
  const depsMap = targetMap.get(target);
  if (depsMap) {
    const deps = depsMap.get(key);
    if (deps) {
      deps.forEach( effect => {
        effect();
      });
    }
  }
}


function effect(fn) {
  const effect = createReactiveEffect(fn);
  effect();
}
function createReactiveEffect(fn) {
  const effect = () => run(effect, fn);
  return effect;
}

function run(effect, fn) {  //运行 fn 且存储基于他的响应式函数
  activeEffectStacks.push(effect);
  fn(); // 运行过程中若取到 响应式数据就会把 fn 放入 map 表
  activeEffectStacks.pop(effect); // 删除 fn
}


//判断是否是对象
function isObject(target) {
  return typeof target === 'object' && target !== null;
}
// 判断是否有该属性
function hasOwn(target, key) {
  return target.hasOwnProperty(key);
}



const obj = reactive({name: 'laoli'});
// 副作用函数
effect(() => {
  const name =  obj.name;
  console.log('render:' + name);
})

obj.name = 'zpt'
obj.name = 'zpt'
obj.name = 'zpt'
