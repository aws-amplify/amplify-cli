const { getCodegenPackage } = require('../../src/utils/getCodegenPackage');

// old codegen package
jest.mock('amplify-codegen-appsync-model-plugin', () => {
  const module = jest.requireActual('amplify-codegen-appsync-model-plugin');
  return {
    ...module,
    name: 'OldCodegenPackage',
  };
});

// new codegen package
jest.mock('@aws-amplify/appsync-modelgen-plugin', () => {
  const module = jest.requireActual('@aws-amplify/appsync-modelgen-plugin');
  return {
    ...module,
    name: 'NewCodegenPackage',
  };
});

it('getCodegenPackage', () => {
  expect(getCodegenPackage(false)).toBeDefined();
  expect(getCodegenPackage(false).name).toEqual('OldCodegenPackage');
  expect(getCodegenPackage(true)).toBeDefined();
  expect(getCodegenPackage(true).name).toEqual('NewCodegenPackage');
});
