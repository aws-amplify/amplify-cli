export function defer(done) {
  if (typeof done === 'function') {
    setImmediate(done);
  }
}
