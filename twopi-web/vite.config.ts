import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tsconfigPaths(),
    TanStackRouterVite({ autoCodeSplitting: true }),
    react({
      babel: {
        plugins: ["babel-plugin-react-compiler", {}],
      },
    }),
    tailwindcss(),
  ],
  server: {
    proxy: {
      "/twopi-api": "http://localhost:8000",
      "/swagger-ui": "http://localhost:8000",
      "/scalar": "http://localhost:8000",
      "/openapi.json": "http://localhost:8000",
    },
  },
});
