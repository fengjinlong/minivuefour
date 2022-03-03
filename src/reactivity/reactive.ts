// import { track, trigger } from "./effect";
import { mutableHandles, readonlyHandles, shallowReadonlyHandles } from "./baseHandlers";
import { track, trigger } from "./effect2";
export const enum ReactiveFlegs {
  IS_REACTIVE = '__v_isReactive',
  IS_READONLY = '__v_isREADONLY'
}

export function reactive(raw) {
  return createReactiveObject(raw, mutableHandles)
  // return new Proxy(raw, {
  //   get: createGetter(true),
  //   set: createSetter(true),
  // });
}

export function readonly(raw) {
  return createReactiveObject(raw, readonlyHandles)

}
function createReactiveObject(raw:any, baseHandlers: ProxyHandler<any>) {
  return new Proxy(raw, baseHandlers)
}

export function isReadOnly(raw) {
  return !!raw[ReactiveFlegs.IS_READONLY]
}
export function isReactive(raw) {
  return !!raw[ReactiveFlegs.IS_REACTIVE]
}
export function isProxy(raw) {
  return !!raw[ReactiveFlegs.IS_REACTIVE] || !!raw[ReactiveFlegs.IS_READONLY]
}
export function shallowReadonly(raw) {
  return createReactiveObject(raw, shallowReadonlyHandles)
}