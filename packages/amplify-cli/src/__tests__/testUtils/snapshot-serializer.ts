const originalPlatform = process.platform;

// converts inputs to toMatchInlineSnapshot() function into supported format
export const windowsPathSerializer = {
  test(val) {
    return typeof val === 'string' && originalPlatform === 'win32';
  },
  print(val) {
    return `"${(val as string).replace(/\\/g, '\\')}"`;
  },
};

test('validateWindowsPathSerializer', () => {
  expect(windowsPathSerializer).toBeDefined();
});
