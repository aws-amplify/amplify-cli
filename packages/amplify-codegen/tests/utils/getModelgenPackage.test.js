const { getModelgenPackage } = require('../../src/utils/getModelgenPackage');

// old codegen package
jest.mock('amplify-codegen-appsync-model-plugin', () => {
  const module = jest.requireActual('amplify-codegen-appsync-model-plugin');
  return {
    ...module,
    name: 'OldModelgenPackage',
  };
});

// new codegen package
jest.mock('@aws-amplify/appsync-modelgen-plugin', () => {
  const module = jest.requireActual('@aws-amplify/appsync-modelgen-plugin');
  return {
    ...module,
    name: 'NewModelgenPackage',
  };
});

it('getModelgenPackage', () => {
  expect(getModelgenPackage(false)).toBeDefined();
  expect(getModelgenPackage(false).name).toEqual('OldModelgenPackage');
  expect(getModelgenPackage(true)).toBeDefined();
  expect(getModelgenPackage(true).name).toEqual('NewModelgenPackage');
});
