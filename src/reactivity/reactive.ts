// import { track, trigger } from "./effect";
import { track, trigger } from "./effect2";

export function reactive (raw) {
  return new Proxy(raw, {
    get(target, key) {
      const res = Reflect.get(target, key);
      track(target, key)
      return res
    }, 
    set(target, key, value) {
      // console.log('sss')
      const res = Reflect.set(target, key, value);
      trigger(target, key)

      return res
    }
  })
}