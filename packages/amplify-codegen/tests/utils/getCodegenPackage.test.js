const { getCodegenPackageName, CODEGEN_OLD_PACKAGE, CODEGEN_NEW_PACKAGE } = require('../../src/utils/getCodegenPackageName');

it('getCodegenPackageName', () => {
  expect(getCodegenPackageName(false)).toBe(CODEGEN_OLD_PACKAGE);
  expect(getCodegenPackageName(true)).toBe(CODEGEN_NEW_PACKAGE);
});
