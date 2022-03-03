import { isObject } from "../shared";
import { track, trigger } from "./effect2";
import { reactive, ReactiveFlegs, readonly } from "./reactive";

// shallow 浅层次
function createGetter(isReadOnly = false, shallow = false) {
  return function get(target, key) {
    if (key === ReactiveFlegs.IS_REACTIVE) {
      return !isReadOnly;
    } else if (key === ReactiveFlegs.IS_READONLY) {
      return isReadOnly;
    }
    let res = Reflect.get(target, key);
    if (shallow) {
      return res;
    }
    if (isObject(res)) {
      return isReadOnly ? readonly(res) : reactive(res);
    }
    // TODO 收集依赖
    if (!isReadOnly) {
      track(target, key);
    }
    return res;
  };
}
function createSetter() {
  return function set(target, key, value) {
    let res = Reflect.set(target, key, value);
    trigger(target, key);
    return res;
  };
}
const get = createGetter();
const set = createSetter();
export const mutableHandles = {
  get,
  set,
};

const readonlyGet = createGetter(true);
export const readonlyHandles = {
  get: readonlyGet,
  set(target, key, value) {
    console.warn(`${key} 不能set，readonly！`);
    return true;
  },
};
