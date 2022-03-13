import { isArray, isObject } from "../shared";
import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { createVNode } from "./vnode";

export function render(vnode, container) {
  patch(vnode, container);
}
function patch(vnode: any, container: any) {
  const { shapeFlag } = vnode;
  if (shapeFlag & ShapeFlags.ELEMENT) {
    processElement(vnode, container);
  } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    // 组件
    processComponent(vnode, container);
  }
}

function processComponent(vnode: any, container: any) {
  mountComponent(vnode, container);
}

function mountComponent(initialVnode: any, container: any) {
  const instance = createComponentInstance(initialVnode);
  // 初始化 props solts setupState
  setupComponent(instance);
  // 组件实例 调用 render
  setupRenderEffect(instance, initialVnode, container);
}
function setupRenderEffect(instance: any, initialVnode, container: any) {
  const { proxy } = instance;
  // 执行 render 是为了获取 vnode，然后进行 patch element
  const subTree = instance.render.call(proxy);
  patch(subTree, container);
  initialVnode.el = subTree.el;
}
function processElement(vnode: any, container: any) {
  const el = (vnode.el = document.createElement(vnode.type));
  const { props, children, shapeFlag } = vnode;

  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    el.textContent = children;
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    mountChildren(vnode, el);
  }

  for (const prop in props) {
    let val = props[prop];
    el.setAttribute(prop, val);
  }

  container.append(el);
}
function mountChildren(vnode: any, el: any) {
  for (const child of vnode.children) {
    patch(child, el);
  }
}
