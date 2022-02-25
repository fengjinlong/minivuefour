let activeEffect;
let targetMap = new WeakMap();
class ReactiveEffect {
  private _fn: any;
  constructor(fn) {
    this._fn = fn;
  }
  run() {
    activeEffect = this;
    return this._fn();
  }
}

export function effect(fn) {
  const _effect = new ReactiveEffect(fn);
  _effect.run();
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

  dep.add(activeEffect);
}
export function trigger (target, key) {
  let depMap = targetMap.get(target);
  let dep = depMap.get(key)
  for(const effect of dep) {
    effect.run()
  }
}
