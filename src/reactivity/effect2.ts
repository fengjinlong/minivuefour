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
  // 没有options 或者 没写 lazy， 那么必须执行第一次的 effect 
  if (!options || !options.lazy) {
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
  // 是否是新增的依赖
  let shouldTrack = false;
  if (effectTrackDepth <= 30) {
    // 查看是否记录过当前依赖
    if (!newTracked(dep)) {
      // 不是新依赖,标记为新依赖
      dep.n |= trackOpBit;
      // 如果之前已经收集过，则不是新增依赖
      // 如果依赖已经被收集，则不需要再次收集
      shouldTrack = !wasTracked(dep);
    }
  } else {
    // balabala
    // 如果层叠数超过了最大，则查看当前dep在effect中实收存储过
    // 因为超过最大进入前会清空所有dep，
    // 第一次进入一定会收集，当收集重复key时才会跳过
  }
  if (shouldTrack) {
    // 添加
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
  }
}

// 数据收集是动态的，所以每次执行收集前需要清空之前的依赖，然后附加上现在的依赖，确保依赖正确
export const createDep = (effects?) => {
  const dep: any = new Set(effects);
  // 之前被收集
  dep.w = 0;
  // 当前被收集
  dep.n = 0;
  return dep;
};

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

export function trigger2(target, key) {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    // never been tracked
    return;
  }
  let deps: any = [];

  deps.push(depsMap);
  // return
  if (deps.length === 1) {
    if (deps[0]) {
      triggerEffects(deps);
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
