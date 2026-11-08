import { expect, test } from "@playwright/test";
import { t } from "../src/locales";

test("serves the app shell offline after the first visit", async ({ page, context }) => {
  await page.goto("/");
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

  await context.setOffline(true);
  await page.reload();

  await expect(page.getByRole("heading", { name: t("home.title") })).toBeVisible();
});
