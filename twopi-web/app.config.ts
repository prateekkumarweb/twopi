import { defineConfig } from "@tanstack/start/config";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  react: {
    babel: {
      plugins: ["babel-plugin-react-compiler", {}],
    },
  },
  vite: {
    plugins: [tsconfigPaths(), tailwindcss()],
  },
});
