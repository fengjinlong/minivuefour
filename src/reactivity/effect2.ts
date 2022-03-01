import { extend } from "../shared/index";
export let trackOpBit = 1;
export let shouldTrack = true;
let activeEffect;
export const isArray = Array.isArray;
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
    let lastShouldTrack = shouldTrack;
    while (parent) {
      if (parent === this) {
        return;
      }
      parent = parent.parent;
    }

    try {
      this.parent = activeEffect;
      activeEffect = this;
      shouldTrack = true;

      trackOpBit = 1 << ++effectTrackDepth; // 2 4 8
      if (effectTrackDepth <= 30) {
        initDepMarkers(this);
      } else {
        cleanupEffect(this);
      }
      return this.fn();
    } finally {
      if (effectTrackDepth <= 30) {
        finalizeDepMarkers(this);
      }

      trackOpBit = 1 << --effectTrackDepth;

      activeEffect = this.parent;
      shouldTrack = lastShouldTrack;
      this.parent = undefined;
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

export const finalizeDepMarkers = (effect) => {
  const { deps } = effect;
  if (deps.length) {
    let ptr = 0;
    for (let i = 0; i < deps.length; i++) {
      const dep = deps[i];
      // 已经收集且不是新收集的  清除
      if (wasTracked(dep) && !newTracked(dep)) {
        dep.delete(effect);
      } else {
        deps[ptr++] = dep;
      }
      // clear bits
      // ~ 取反
      dep.w &= ~trackOpBit;
      dep.n &= ~trackOpBit;
    }
    deps.length = ptr;
  }
};

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

export function stop(runner) {
  runner.effect.stop();
}
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
export function trigger(target, key) {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    // never been tracked
    return;
  }
  let deps: any = [];

  deps.push(depsMap);
  if (deps.length === 1) {
    if (deps[0]) {
      triggerEffects(deps[0]);
    }
  } else {
  }
}
export function triggerEffects(dep) {
  // spread into array for stabilization
  for (const effect of isArray(dep) ? dep : [...dep]) {
    if (effect !== activeEffect) {
      if (effect.scheduler) {
        effect.scheduler();
      } else {
        effect.run();
      }
    }
  }
}

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
