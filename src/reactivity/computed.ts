import { effect } from "./effect2";
import { ReactiveEffect } from "./effect2";
// .value
// 缓存 dirty
class Com {
  private _effect: any;
  private _value: any;
  private _dirty: boolean = true;

  constructor(getter) {
    this._effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) {
        this._dirty = true;
      }
    });
  }
  get value() {
    if (this._dirty) {
      this._dirty = false;
      this._value = this._effect.run()
    }
    return this._value
  }
}
export function computed(getter) {
  return new Com(getter);
}

// class ComputedEffect {
//   private _effect: any;
//   private _dirty: boolean = true;
//   private _value: any;
//   constructor(getter) {
//     this._effect = effect(getter, {
//       // lazy:  true,
//       scheduler:() => {
//         console.log("123")
//         if (!this._dirty) {
//           this._dirty = true;
//         }
//       }
//     });
//   }
//   get value() {
//     if (this._dirty) {
//       this._dirty = false;
//       this._value = this._effect();
//     }
//     return this._value;
//   }
// }
// export function computed(getter) {
//   return new ComputedEffect(getter);
// }
