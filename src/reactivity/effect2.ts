import { extend } from "../shared/index";
export let trackOpBit = 1;
let activeEffect;
let targetMap = new WeakMap();
let effectTrackDepth = 0;

class ReactiveEffect {
  active = true;
  deps = [];
  parent = undefined;
  onStop?: () => void;

  constructor(public fn, public scheduler?) {
    // this._fn = fn;
    // recordEffectScope
  }
  run() {
    if (!this.active) {
      return this.fn();
    }
    let parent = activeEffect;
    while (parent) {
      if (parent === this) {
        return;
      }
      parent = parent.parent;
    }

    try {
      this.parent = activeEffect;
      activeEffect = this;

      trackOpBit = 1 << ++effectTrackDepth; // 2 4 8
      if (effectTrackDepth <= 30) {
        initDepMarkers(this);
      } else {
        cleanupEffect(this);
      }
      return this.fn();
    } finally {
    }
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
export const initDepMarkers = ({ deps }) => {
  if (deps.length) {
    for (let i = 0; i < deps.length; i++) {
      deps[i].w |= trackOpBit; // set was tracked
    }
  }
};

export function effect<T = any>(fn: () => T, options?) {
  const _effect = new ReactiveEffect(fn);
  if (options) {
    extend(_effect, options);
  }
  if (!options) {
    _effect.run();
  }
  const runner: any = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner;
}

export function stop(runner) {}
export function track(target, key) {
  if (activeEffect) {
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map()));
    }
    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, (dep = createDep()));
    }
    // 收集
    trackEffects(dep);
  }
}
// 已经收集
export const wasTracked = (dep): boolean => (dep.w & trackOpBit) > 0;
// 新收集
export const newTracked = (dep): boolean => (dep.n & trackOpBit) > 0;

function trackEffects(dep) {
  let shouldTrack = false;
  if (effectTrackDepth <= 30) {
    if (!newTracked(dep)) {
      // 不是新收集,设置新收集
      dep.n |= trackOpBit;
      // 没有收集的设置为应该 track, 已经收集的 不 tract
      shouldTrack = !wasTracked(dep);
    }
  } else {
    // balabala
  }
  if (shouldTrack) {
    // 添加
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
  }
}

export const createDep = (effects?) => {
  const dep: any = new Set(effects);
  // 已经标记
  dep.w = 0;
  // 新标记
  dep.n = 0;
  return dep;
};
export function trigger(target, key) {}

// 清除
function cleanupEffect(effect) {
  const { deps } = effect;
  if (deps.length) {
    for (let i = 0; i < deps.length; i++) {
      deps[i].delete(effect);
    }
    deps.length = 0;
  }
}
