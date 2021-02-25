const { getDocsgenPackage } = require('../../src/utils/getDocsgenPackage');

// old graphQL statements generator package
jest.mock('amplify-graphql-docs-generator', () => {
  const module = jest.requireActual('amplify-graphql-docs-generator');
  return {
    ...module,
    name: 'OldDocsgenPackage',
  };
});

// new graphQL statements generator package
jest.mock('@aws-amplify/graphql-docs-generator', () => {
  const module = jest.requireActual('@aws-amplify/graphql-docs-generator');
  return {
    ...module,
    name: 'NewDocsgenPackage',
  };
});

it('getDocsgenPackage', () => {
  expect(getDocsgenPackage(false)).toBeDefined();
  expect(getDocsgenPackage(false).name).toEqual('OldDocsgenPackage');
  expect(getDocsgenPackage(true)).toBeDefined();
  expect(getDocsgenPackage(true).name).toEqual('NewDocsgenPackage');
});
