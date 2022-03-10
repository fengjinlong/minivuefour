export function createComponentInstance(vnode) {
  const instance = {
    vnode,
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
  const component = instance.vnode.type;
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

  finshComponentSetup(instance);
}

function finshComponentSetup(instance: any) {
  const component = instance.type;

  instance.render = component.render;
}
