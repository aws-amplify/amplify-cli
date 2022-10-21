/**
 * Convenience function that returns a callback that can be passed to .mockImplementation
 * that sets the implementation to the actual implementation
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mockWithActual = (moduleName: string, exportName: string) => (...args: any[]) => {
  const { [exportName]: actual } = jest.requireActual(moduleName);
  return actual(...args);
};
