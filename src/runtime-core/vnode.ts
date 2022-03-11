export function createVNode(type: string, props?, children?) {
  const vnode = {
    type,
    props,
    el: null,
    children,
  };
  return vnode;
}
