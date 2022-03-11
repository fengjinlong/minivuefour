import { isArray, isObject } from "../shared";
import { createComponentInstance, setupComponent } from "./component";
import { createVNode } from "./vnode";

export function render(vnode, container) {
  patch(vnode, container);
}
function patch(vnode: any, container: any) {
  if (typeof vnode.type === "string") {
    processElement(vnode, container);
  } else if (isObject(vnode.type)) {
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
  const { props, children } = vnode;

  if (typeof children === "string") {
    el.textContent = children;
  } else if (isArray(children)) {
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
