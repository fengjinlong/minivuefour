let activeEffect;
let targetMap = new WeakMap();
class ReactiveEffect {
  private _fn: any;
   deps= [] ;
  constructor(fn, public scheduler?) {
    this._fn = fn;
  }
  run() {
    activeEffect = this;
    cleanupEffect(this)
    // console.log(this.deps)
    return this._fn();
  }
}

export function effect(fn, options:any={}) {
  const scheduler = options.scheduler
  const _effect = new ReactiveEffect(fn, scheduler);
  // console.log(1)
  _effect.run();
  return _effect.run
}

export function track(target, key) {
  // WeakMap - key
  // target Map

  let depMap = targetMap.get(target);
  if (!depMap) {
    depMap = new Map();
    targetMap.set(target, depMap);
  }

  let dep = depMap.get(key);
  if (!dep) {
    dep = new Set();
    depMap.set(key, dep);
  }
  // if (activeEffect) {

    
    dep.add(activeEffect);

    activeEffect.deps.push(dep);
  // }
}
export function trigger (target, key) {
  let depMap = targetMap.get(target);
  let dep = depMap.get(key)
  for(const effect of dep) {
    if (effect.scheduler) {
      effect.scheduler()
    } else {

      effect.run()
    }
  }
}
function cleanupEffect(effect: any) {
  console.log(effect.deps.length)
  // console.log(effect.deps)
  let {deps} = effect
  // let deps = new Set(deps) 
  if (deps.length) {
    for(let i =0;i<deps.length;i++) {
      deps[i].delete(effect)
    }
    deps.length = 0
  }
}

