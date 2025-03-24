import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import devtools from "solid-devtools/vite";
import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    TanStackRouterVite({ target: "solid", autoCodeSplitting: true }),
    devtools({
      autoname: true,
    }),
    solid(),
    tailwindcss(),
  ],
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
