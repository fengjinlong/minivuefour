import { h } from "../../lib/guide-mini-vue.esm.js";
window.self = null;
export const App = {
  render() {
    window.self = this;
    return h("div", { id: "div" }, [
      h("p", { class: "p1" }, "p1"),
      h("p", { class: "p2" }, this.msg),
    ]);
  },
  setup() {
    return {
      msg: "Hello vue",
    };
  },
};
