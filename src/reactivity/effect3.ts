import { extend, isArray } from "../shared";
import {
  createDep,
  finalizeDepMarkers,
  initDepMarkers,
  newTracked,
  wasTracked,
} from "./dep";

// The main WeakMap that stores {target -> key -> dep} connections.
// Conceptually, it's easier to think of a dependency as a Dep class
// which maintains a Set of subscribers, but we simply store them as
// raw Sets to reduce memory overhead.
const targetMap = new WeakMap();

// The number of effects currently being tracked recursively.
let effectTrackDepth = 0;

export let trackOpBit = 1;

/**
 * The bitwise track markers support at most 30 levels of recursion.
 * This value is chosen to enable modern JS engines to use a SMI on all platforms.
 * When recursion depth is greater, fall back to using a full cleanup.
 */
const maxMarkerBits = 30;

export let activeEffect;

export class ReactiveEffect<T = any> {
  active = true;
  deps: any = [];
  parent: ReactiveEffect | undefined = undefined;

  allowRecurse?: boolean;

  onStop?: () => void;
  // dev only

  constructor(public fn: () => T, public scheduler?, scope?) {
    // recordEffectScope(this, scope)
  }

  run() {
    if (!this.active) {
      return this.fn();
    }
    let parent: ReactiveEffect | undefined = activeEffect;
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

      trackOpBit = 1 << ++effectTrackDepth;

      if (effectTrackDepth <= maxMarkerBits) {
        initDepMarkers(this);
      } else {
        cleanupEffect(this);
      }
      return this.fn();
    } finally {
      if (effectTrackDepth <= maxMarkerBits) {
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

function cleanupEffect(effect) {
  const { deps } = effect;
  if (deps.length) {
    for (let i = 0; i < deps.length; i++) {
      deps[i].delete(effect);
    }
    deps.length = 0;
  }
}

export function effect<T = any>(fn: () => T, options?) {
  const _effect = new ReactiveEffect(fn);
  if (options) {
    extend(_effect, options);
    // if (options.scope) recordEffectScope(_effect, options.scope)
  }
  // if (!options || !options.lazy) {
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

export let shouldTrack = true;

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
// export function trigger(
//   target: object,
//   type,
//   key?: unknown,
//   newValue?: unknown,
//   oldValue?: unknown,
//   oldTarget?: Map<unknown, unknown> | Set<unknown>
// ) {
//   const depsMap = targetMap.get(target)
//   if (!depsMap) {
//     // never been tracked
//     return
//   }

//   let deps = []
//   if (type === TriggerOpTypes.CLEAR) {
//     // collection being cleared
//     // trigger all effects for target
//     deps = [...depsMap.values()]
//   } else if (key === 'length' && isArray(target)) {
//     depsMap.forEach((dep, key) => {
//       if (key === 'length' || key >= (newValue as number)) {
//         deps.push(dep)
//       }
//     })
//   } else {
//     // schedule runs for SET | ADD | DELETE
//     if (key !== void 0) {
//       deps.push(depsMap.get(key))
//     }

//     // also run for iteration key on ADD | DELETE | Map.SET
//     switch (type) {
//       case TriggerOpTypes.ADD:
//         if (!isArray(target)) {
//           deps.push(depsMap.get(ITERATE_KEY))
//           if (isMap(target)) {
//             deps.push(depsMap.get(MAP_KEY_ITERATE_KEY))
//           }
//         } else if (isIntegerKey(key)) {
//           // new index added to array -> length changes
//           deps.push(depsMap.get('length'))
//         }
//         break
//       case TriggerOpTypes.DELETE:
//         if (!isArray(target)) {
//           deps.push(depsMap.get(ITERATE_KEY))
//           if (isMap(target)) {
//             deps.push(depsMap.get(MAP_KEY_ITERATE_KEY))
//           }
//         }
//         break
//       case TriggerOpTypes.SET:
//         if (isMap(target)) {
//           deps.push(depsMap.get(ITERATE_KEY))
//         }
//         break
//     }
//   }

//   const eventInfo = __DEV__
//     ? { target, type, key, newValue, oldValue, oldTarget }
//     : undefined

//   if (deps.length === 1) {
//     if (deps[0]) {
//       if (__DEV__) {
//         triggerEffects(deps[0], eventInfo)
//       } else {
//         triggerEffects(deps[0])
//       }
//     }
//   } else {
//     const effects: ReactiveEffect[] = []
//     for (const dep of deps) {
//       if (dep) {
//         effects.push(...dep)
//       }
//     }
//     if (__DEV__) {
//       triggerEffects(createDep(effects), eventInfo)
//     } else {
//       triggerEffects(createDep(effects))
//     }
//   }
// }

// export function triggerEffects(
//   dep: Dep | ReactiveEffect[],
//   debuggerEventExtraInfo?: DebuggerEventExtraInfo
// ) {
//   // spread into array for stabilization
//   for (const effect of isArray(dep) ? dep : [...dep]) {
//     if (effect !== activeEffect || effect.allowRecurse) {
//       if (__DEV__ && effect.onTrigger) {
//         effect.onTrigger(extend({ effect }, debuggerEventExtraInfo))
//       }
//       if (effect.scheduler) {
//         effect.scheduler()
//       } else {
//         effect.run()
//       }
//     }
//   }
// }
