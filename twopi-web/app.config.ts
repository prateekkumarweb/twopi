import { defineConfig } from "@tanstack/start/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  react: {
    babel: {
      plugins: ["babel-plugin-react-compiler", {}],
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
