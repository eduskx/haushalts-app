import { describe, expect, it } from "vitest";
import { de } from "./de";
import { t } from "./index";

describe("t", () => {
  it("returns the German text for a key", () => {
    expect(t("home.title")).toBe(de["home.title"]);
  });
});
