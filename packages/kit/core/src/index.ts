/** Makes a switch or if-chain exhaustive: the compiler errors when a case is missed. */
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
}
