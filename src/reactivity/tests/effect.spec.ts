// import { effect, stop } from "../effect";
import { effect, stop } from "../effect2";
import { reactive } from "../reactive";
describe("effect", () => {
  it("happy path", () => {
    const user = reactive({
      age: 10,
    });
    let nextAge;
    effect(() => {
      nextAge = user.age + 1;
    });
    user.age++;
    expect(nextAge).toBe(12);
  });
  it("should return runner when call effect", () => {
    let foo = 10;
    const runner = effect(() => {
      foo++;
      return foo;
    });
    expect(foo).toBe(11);
    const r = runner();
    expect(foo).toBe(12);
    expect(r).toBe(foo);
  });

  it("scheduler", () => {
    let dummy;
    let run: any;
    const scheduler = jest.fn(() => {
      run = runner;
    });
    const obj:any= reactive({ foo: 1 });
    const runner = effect(
      () => {
        dummy = obj.foo;
      },
      {
        scheduler,
      }
    );
    expect(scheduler).not.toHaveBeenCalled();
    expect(dummy).toBe(1);

    /**
     * 1 执行一次 effect 12313123
     *
     * 1 响应式对象更新，scheduler 执行一次,effect 不执行，也就是不执行 runner
     * 2 执行 runner effect执行
     *
     */
    obj.foo++;
    expect(scheduler).toHaveBeenCalledTimes(1);
    expect(dummy).toBe(1);
    run();
    expect(dummy).toBe(2);
  });

  it("stop", () => {
    let dummy;
    const obj = reactive({ prop: 1 });
    const runner = effect(() => {
      dummy = obj.prop;
    });
    obj.prop = 2;
    expect(dummy).toBe(2);
    stop(runner);
    // 如果stop 包裹这个reunner, 数据不再是响应式的，
    // 也就是说需要把 对应的effect 从 deps 里删掉
    // 根据单测，stop参数就是runner

    // 只执行一次set操作
    // obj.prop = 5;

    // 先执行get 在执行set
    obj.prop++;
    // obj.prop = 3;
    expect(dummy).toBe(2);
    runner();
    expect(dummy).toBe(3);
  });
  it("onStop", () => {
    const obj = reactive({
      foo: 1,
    });
    const onStop = jest.fn();
    let dummy;
    const runner = effect(
      () => {
        dummy = obj.foo;
      },
      {
        onStop,
      }
    );
    stop(runner);
    expect(onStop).toBeCalledTimes(1);
  });

  it("effect 压栈的测试", () => {
    const counter = reactive({
      num: 0,
      num2: 0,
    });

    effect(() => {
      effect(() => {
        console.log("num2:", counter.num2);
      });
      console.log("num:", counter.num);
    });
    counter.num++;
    expect(counter.num).toBe(1)
  });
  it("double effect", () => {
    const obj = reactive({
      a: 1,
      b: 1,
    });
    let temp1;
    let temp2;
    effect(() => {
      console.log("effect1");
      effect(() => {
        console.log("effect2");
        temp2 = obj.b + 1;
      });
      console.log("ok");

      temp1 = obj.a + 1;
    });
    obj.a = 2;
    expect(temp1).toBe(3);
  });
  it("lazy", () => {
    const obj = reactive({
      a:1
    })
    let t = 1;
    let run = effect(() => {
      t= obj.a
    }, {
      lazy: true
    })
    obj.a = 2;
    expect(t).toBe(1)
    run()
    expect(t).toBe(2)
  })

});
