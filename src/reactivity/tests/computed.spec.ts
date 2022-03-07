import { computed } from '../computed'
import { reactive } from '../reactive'

describe('computed', () => {
  it('happy path', () => {
    // ref 
    // .value 
    // 缓存

    const user = reactive({
      age: 1,
    })

    const age = computed(() => {
      return user.age
    })

    expect(age.value).toBe(1)
  })
  it('should computed lazily', () => {
    const value = reactive({
      foo: 1
    })
    

    const getter = jest.fn(() => {
      return value.foo
    })
    const cValue = computed(getter)

    // 测试 1
    // lazy
    /**
     * 如果没有调用 cValue 的话，getter 不会执行
    */
    expect(getter).not.toHaveBeenCalled()
    // 调用一次 cValue
    expect((cValue.value)).toBe(1)
    // 触发一次函数
    expect(getter).toHaveBeenCalledTimes(1)

    // 再次调用
    cValue.value;
    expect(getter).toHaveBeenCalledTimes(1)

    // 测试 2 
    value.foo = 2

    // 触发set，触发trigger，调用getter，如果执行100次，那么就是触发100次的 set-trigger-getter,
    // 这显然不合理。触发set 只是把dirty 打开，当你下次调用get 时候会自动只触发一次 getter
    // 测试 3 触发set 操作，同样不想再次调用一次getter()，不然缓存有什么用
    expect(getter).toHaveBeenCalledTimes(1)
    
    
    // 测试 4
    // // now it should computed
    expect(cValue.value).toBe(2)
    expect(getter).toHaveBeenCalledTimes(2)
    
    // // // sgould not computed again
    cValue.value;
    expect(getter).toHaveBeenCalledTimes(2)

    value.foo = 100
    expect(getter).toHaveBeenCalledTimes(2)

    // cValue.value

    // expect(getter).toHaveBeenCalledTimes(2)
  })
})
