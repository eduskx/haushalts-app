import { defineConfig, devices } from "@playwright/test";

// Port comes from the preview config in vite.config.ts.
const baseURL = "http://localhost:4173";

export default defineConfig({
  testDir: "e2e",
  use: { baseURL, trace: "retain-on-failure" },
  projects: [
    { name: "chromium", use: { ...devices["Pixel 7"] } },
    { name: "webkit", use: { ...devices["iPhone 15"] } },
  ],
  webServer: {
    command: "pnpm build && pnpm preview",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
});
