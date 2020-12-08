const { getCodegenPackageName } = require('../../src/utils/getCodegenPackageName');
const CODEGEN_OLD_PACKAGE = 'amplify-codegen-appsync-model-plugin';
const CODEGEN_NEW_PACKAGE = '@aws-amplify/appsync-modelgen-plugin';

const mockaddToSchema = jest.fn();
const mockplugin = jest.fn();

const oldCodegenPackage_mock = {
  __esModule: true,
  addToSchema: mockaddToSchema,
  plugin: mockplugin,
  preset: {
    buildGeneratesSection: jest.fn(),
  },
};

const newCodegenPackage_mock = {
  __esModule: true,
  addToSchema: mockaddToSchema,
  plugin: mockplugin,
  preset: {
    buildGeneratesSection: jest.fn(),
  },
};

it('getCodegenPackageName', () => {
  jest.mock(CODEGEN_OLD_PACKAGE, () => ({
    __esModule: true,
    addToSchema: jest.fn(),
    plugin: jest.fn(),
    preset: {
      buildGeneratesSection: jest.fn(),
    },
  }));
  jest.mock(CODEGEN_NEW_PACKAGE, () => ({
    __esModule: true,
    addToSchema: jest.fn(),
    plugin: jest.fn(),
    preset: {
      buildGeneratesSection: jest.fn(),
    },
  }));
  expect(getCodegenPackageName(false)).toBeDefined();
  expect(JSON.stringify(getCodegenPackageName(false))).toEqual(JSON.stringify(oldCodegenPackage_mock));
  expect(getCodegenPackageName(true)).toBeDefined();
  expect(JSON.stringify(getCodegenPackageName(false))).toEqual(JSON.stringify(newCodegenPackage_mock));
});
