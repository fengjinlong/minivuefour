import { PublicInstanceProxyHandlers } from "./componentPublicInstance";

export function createComponentInstance(vnode) {
  const instance = {
    vnode,
    type: vnode.type,
    proxy: {},
  };
  return instance;
}
export function setupComponent(instance) {
  // 初始化
  // initProps()
  // initSlots()

  // 创建有状态的组件
  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance: any) {
  instance.proxy = new Proxy(
    { _: instance },
    PublicInstanceProxyHandlers
    // {
    //   get(target, key) {
    //     const { setupState } = instance;
    //     if (key in setupState) {
    //       return setupState[key];
    //     }
    //     if (key === "$el") {
    //       return instance.vnode.el;
    //     }
    //   },
    // }
  );
  const component = instance.type;
  const { setup } = component;
  if (setup) {
    const setupResult = setup();
    handleSetupResult(instance, setupResult);
  }
}
function handleSetupResult(instance, setupResult: any) {
  if (typeof setupResult === "object") {
    instance.setupState = setupResult;
  }

  finishComponentSetup(instance);
}

function finishComponentSetup(instance: any) {
  console.log(instance);
  const component = instance.vnode.type;

  instance.render = component.render;
}
