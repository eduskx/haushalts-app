import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { de } from "./src/locales/de";

// Light background from docs/design/tokens.css; the manifest cannot read CSS variables.
const background = "#F0EDF2";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: de["app.name"],
        short_name: de["app.shortName"],
        lang: "de",
        start_url: "/",
        scope: "/",
        display: "standalone",
        theme_color: background,
        background_color: background,
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "/icons/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: { navigateFallback: "/index.html" },
    }),
  ],
  // Fixed so the tester agent and e2e tests find the preview without guessing.
  preview: { port: 4173, strictPort: true },
  test: { environment: "jsdom", include: ["src/**/*.test.{ts,tsx}"] },
});
