import { isArray, isObject } from "../shared";
import { createComponentInstance, setupComponent } from "./component";

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

function mountComponent(vnode: any, container: any) {
  const instance = createComponentInstance(vnode);
  // 初始化 props solts setupState
  setupComponent(instance);
  // 组件实例 调用 render
  setupRenderEffect(instance, container);
}
function setupRenderEffect(instance: any, container: any) {
  // 执行 render 是为了获取 vnode，然后进行 patch
  const subTree = instance.render();
  patch(subTree, container);
}
function processElement(vnode: any, container: any) {
  const el = document.createElement(vnode.type);
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
