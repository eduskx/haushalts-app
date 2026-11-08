import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Fixed so the tester agent and e2e tests find the preview without guessing.
  preview: { port: 4173, strictPort: true },
  test: { environment: "jsdom" },
});
