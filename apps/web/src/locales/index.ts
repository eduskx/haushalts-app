import { de, type TextKey } from "./de";

/** Returns the UI text for a key. German only for now. */
export function t(key: TextKey): string {
  return de[key];
}
