import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Keep the map and QR libraries out of the app chunk — they change far
        // less often than application code, so they cache independently.
        manualChunks: {
          react: ["react", "react-dom"],
          leaflet: ["leaflet"],
          qrcode: ["qrcode"],
        },
      },
    },
  },
});
