import typescript from "@rollup/plugin-typescript";
import pkj from "./package.json";
export default {
  input: "./src/index.ts",
  output: [
    {
      format: "cjs",
      file: pkj.main,
    },
    {
      format: "es",
      file: pkj.module,
    },
  ],
  plugins: [typescript()],
};
