import ui from "@nuxt/ui/vite";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";
import vueRouter from "unplugin-vue-router/vite";
import { defineConfig } from "vite";
import vueDevTools from "vite-plugin-vue-devtools";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vueRouter({}),
    vue(),
    vueDevTools(),
    tailwindcss(),
    ui({
      autoImport: {
        imports: ['vue', 'vue-router', ],
      },
      ui: {
        colors: {
          primary: "blue",
        },
      },
    }),
  ],
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
