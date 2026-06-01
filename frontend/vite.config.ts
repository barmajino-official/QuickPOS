import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    hmr: {
      overlay: false,
    },
    // Forward API + uploaded images to the backend so the browser stays same-origin
    // (no CORS, no hardcoded backend URL). Target is the compose service name on its
    // internal port because the frontend runs inside a container.
    proxy: {
      "/api": { target: "http://backend:8080", changeOrigin: true },
      "/uploads": { target: "http://backend:8080", changeOrigin: true },
    },
  },
});

