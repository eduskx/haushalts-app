import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import eslintConfig from "./eslint.mjs";

const read = (file: string) => readFileSync(new URL(file, import.meta.url), "utf8");

describe("config presets", () => {
  it("tsconfig preset is strict", () => {
    expect(JSON.parse(read("./tsconfig.base.json")).compilerOptions.strict).toBe(true);
  });

  it("eslint preset exports a flat config array", () => {
    expect(Array.isArray(eslintConfig)).toBe(true);
  });

  it("tailwind preset imports tailwindcss", () => {
    expect(read("./tailwind.css")).toContain('@import "tailwindcss"');
  });
});
