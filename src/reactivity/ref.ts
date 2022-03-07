import { isObject } from "../shared";
import { isTracking, trackEffects, triggerEffect } from "./effect";
import { reactive } from "./reactive";

/**
 * @description
 * @author Werewolf
 * @date 2022-03-04
 * @class RefImpl
 *
 * let val = ref(n)
 * 1 .value 的方式调用，val.value
 * 2 触发响应式收集
 */
class RefImpl {
  private _value: any;
  public dep;
  private _rawValue: any;
  public __v_isRef:boolean = true;
  constructor(value) {
    // 原始值
    this._rawValue = value;
    // 如果是对象
    this._value = isObject(value) ? reactive(value) : value;
    this.dep = new Set();
  }
  get value() {
    // 收集依赖
    trackRefValue(this);
    return this._value;
  }
  set value(newValue: any) {
    // 原始值已经变了，需要用原始值做比较
    // if (this._value !== newValue) {
    if (this._rawValue !== newValue) {
      // 触发依赖
      this._value = isObject(newValue) ? reactive(newValue) : newValue;
      this._rawValue = newValue;
      triggerEffect(this.dep);
    }
  }
}
function trackRefValue(ref) {
  if (isTracking()) {
    trackEffects(ref.dep);
  }
}
export function ref(value) {
  return new RefImpl(value);
}
export function isRef(value) {
  return !!value.__v_isRef
}
export function unRef(value) {
  return !!value.__v_isRef ? value.value : value
}
// age 省略 .value 的写法
export function proxyRefs(objectWithRefs) {
  return new Proxy(objectWithRefs, {
    get (target, key) {
      return unRef(Reflect.get(target, key))
    },
    set (target, key, value) {
      if (isRef(target[key]) && !isRef(value)) {
        return target[key].value = value
      } else {
        return Reflect.set(target, key, value)
      }
    }
  })
}