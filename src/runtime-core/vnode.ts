export function createVNode(type: string, props?, children?) {
  const vnode = {
    type,
    props,
    children
  }
  return vnode
}