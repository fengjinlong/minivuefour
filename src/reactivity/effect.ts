import { extend } from "../shared/index";

let activeEffect;
let targetMap = new WeakMap();
class ReactiveEffect {
  private _fn: any;
  deps = [];
  onStop?: () => void;
  active = true;
  constructor(fn, public scheduler?) {
    this._fn = fn;
  }
  run() {
    activeEffect = this;
    // 死循环
    // cleanupEffect(this);
    return this._fn();
  }
  stop() {
    if (this.active) {
      cleanupEffect(this);
      if (this.onStop) {
        this.onStop();
      }
      this.active = false;
    }
  }
}

export function effect(fn, options: any = {}) {
  const scheduler = options.scheduler;
  const _effect = new ReactiveEffect(fn, scheduler);
  extend(_effect, options);
  // _effect.onStop = options.onStop;
  _effect.run();

  const runner: any = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner;
}

export function stop(runner) {
  runner.effect.stop();
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
  if (activeEffect) {
    dep.add(activeEffect);

    activeEffect.deps.push(dep);
  }
}
export function trigger(target, key) {
  let depMap = targetMap.get(target);
  if (!depMap) return;
  let dep = depMap.get(key);
  
  // const effectsToRun:any = new Set(dep)
  // effectsToRun.forEach(effect => effect.run())

  for (const effect of dep) {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}
function cleanupEffect(effect: any) {
  // console.log(effect.deps.length)
  // console.log(effect.deps)
  let { deps } = effect;
  // let deps = new Set(deps)
  if (deps.length) {
    for (let i = 0; i < deps.length; i++) {
      deps[i].delete(effect);
    }
    deps.length = 0;
  }
}
