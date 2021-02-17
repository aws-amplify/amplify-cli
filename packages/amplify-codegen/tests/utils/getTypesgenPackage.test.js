const { getTypesgenPackage } = require('../../src/utils/getTypesgenPackage');

// old types generator package
jest.mock('amplify-graphql-types-generator', () => {
  const module = jest.requireActual('amplify-graphql-types-generator');
  return {
    ...module,
    name: 'OldTypesgenPackage',
  };
});

// new types generator package
jest.mock('@aws-amplify/graphql-types-generator', () => {
  const module = jest.requireActual('@aws-amplify/graphql-types-generator');
  return {
    ...module,
    name: 'NewTypesgenPackage',
  };
});

it('getTypesgenPackage', () => {
  expect(getTypesgenPackage(false)).toBeDefined();
  expect(getTypesgenPackage(false).name).toEqual('OldTypesgenPackage');
  expect(getTypesgenPackage(true)).toBeDefined();
  expect(getTypesgenPackage(true).name).toEqual('NewTypesgenPackage');
});
