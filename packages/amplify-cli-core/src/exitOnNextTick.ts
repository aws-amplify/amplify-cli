export function exitOnNextTick(code: number): void {
  process.nextTick(() => {
    process.exit(code);
  });
}
