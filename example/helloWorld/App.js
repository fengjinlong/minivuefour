import { h } from "../../lib/guide-mini-vue.esm.js";
export const App = {
  render() {
    return h("div", "msg");
  },
  setup() {
    return {
      msg: "Hello vue",
    };
  },
};
