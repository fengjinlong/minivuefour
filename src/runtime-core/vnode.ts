import { ShapeFlags } from "../shared/ShapeFlags";

export function createVNode(type: string, props?, children?) {
  const vnode = {
    type,
    props,
    el: null,
    shapeFlag: getShapeFlag(type),
    children,
  };
  if (typeof children === "string") {
    vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
  } else if (Array.isArray(children)) {
    vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
  }
  return vnode;
}
function getShapeFlag(type) {
  return typeof type === "string"
    ? ShapeFlags.ELEMENT
    : ShapeFlags.STATEFUL_COMPONENT;
}
