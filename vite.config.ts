/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: false,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    // Hosted workspaces (Replit, Codespaces, any container) reach the dev
    // server through a proxy on another hostname. Bind on all interfaces so
    // the proxy can reach it, and allow the hostnames it serves from — Vite
    // rejects requests for hosts it does not recognise, which otherwise shows
    // up as "Blocked request. This host is not allowed."
    host: true,
    allowedHosts: [".replit.dev", ".repl.co", ".app.github.dev"],
    // Those proxies terminate TLS on 443, so the hot-reload client has to be
    // told where to connect rather than inferring the dev server's own port.
    ...(process.env.REPL_ID || process.env.CODESPACE_NAME
      ? { hmr: { clientPort: 443 } }
      : {}),
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
