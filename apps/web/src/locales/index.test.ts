import { describe, expect, it } from "vitest";
import { de } from "./de";
import { t } from "./index";

describe("t", () => {
  it("has a non-empty text for every key", () => {
    for (const key of Object.keys(de) as (keyof typeof de)[]) {
      expect(t(key).trim(), key).not.toBe("");
    }
  });
});
