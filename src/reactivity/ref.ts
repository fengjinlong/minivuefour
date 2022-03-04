import { isTracking, trackEffects, triggerEffect } from "./effect2";

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
  constructor(value) {
    this._value = value;
    this.dep = new Set();
  }
  get value() {
    // 收集依赖
    trackRefValue(this)
    return this._value;
  }
  set value(newValue: any) {
    this._value = newValue;
    // 触发依赖
    triggerEffect(this.dep)
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