import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";
import VueRouter from "unplugin-vue-router/vite";
import { defineConfig } from "vite";
import vueDevTools from "vite-plugin-vue-devtools";

// https://vite.dev/config/
export default defineConfig({
  plugins: [VueRouter({}), vue(), vueDevTools(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    proxy: {
      "/twopi-api": "http://localhost:8000",
      "/swagger-ui": "http://localhost:8000",
      "/scalar": "http://localhost:8000",
      "/rapidoc": "http://localhost:8000",
      "/openapi.json": "http://localhost:8000",
    },
  },
});
