import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
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

  it("tailwind preset's import resolves to an installed package", () => {
    const resolved = createRequire(import.meta.url).resolve("tailwindcss/package.json");
    expect(existsSync(resolved)).toBe(true);
  });
});
