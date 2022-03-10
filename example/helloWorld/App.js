import { h } from "../../lib/guide-mini-vue.esm.js";
export const App = {
  render() {
    return h("div", { id: "div" }, [
      h("p", { class: "p1" }, "p1"),
      h("p", { class: "p2" }, "p2"),
    ]);
  },
  setup() {
    return {
      msg: "Hello vue",
    };
  },
};
