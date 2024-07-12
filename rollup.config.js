import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";

export default [
  {
    input: "dist/main.js",
    plugins: [commonjs(), nodeResolve()],
    output: {
      name: "main",
      file: "dist/bundle.js",
      format: "iife",
    },
  },
];
