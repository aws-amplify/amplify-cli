import * as shouldRenderComponentsDependency from '../commands/utils/shouldRenderComponents';
import * as notifyMissingPackagesDependency from '../commands/utils/notifyMissingPackages';
import * as listUiBuilderComponentsDependency from '../commands/utils/syncAmplifyUiBuilderComponents';
import * as generateUiBuilderComponentsDependency from '../commands/utils/syncAmplifyUiBuilderComponents';
import * as generateUiBuilderThemesDependency from '../commands/utils/syncAmplifyUiBuilderComponents';
import * as listUiBuilderThemesDependency from '../commands/utils/syncAmplifyUiBuilderComponents';
import * as generateAmplifyUiBuilderIndexFileDependency from '../commands/utils/createUiBuilderComponent';
import { run } from '../commands/generateComponents';
jest.mock('../commands/utils/syncAmplifyUiBuilderComponents');
jest.mock('../commands/utils/createUiBuilderComponent');
jest.mock('../commands/utils/shouldRenderComponents');
jest.mock('../commands/utils/notifyMissingPackages');
const shouldRenderComponentsDependency_mock = shouldRenderComponentsDependency as any;
const notifyMissingPackagesDependency_mock = notifyMissingPackagesDependency as any;
const listUiBuilderComponentsDependency_mock = listUiBuilderComponentsDependency as any;
const generateUiBuilderComponentsDependency_mock = generateUiBuilderComponentsDependency as any;
const generateUiBuilderThemesDependency_mock = generateUiBuilderThemesDependency as any;
const listUiBuilderThemesDependency_mock = listUiBuilderThemesDependency as any;
const generateAmplifyUiBuilderIndexFileDependency_mock = generateAmplifyUiBuilderIndexFileDependency as any;

shouldRenderComponentsDependency_mock.shouldRenderComponents = jest.fn().mockImplementation(() => true);
notifyMissingPackagesDependency_mock.notifyMissingPackages = jest.fn().mockImplementation(() => true);

describe('can generate components', () => {
  let context: any;
  let schemas: any;
  let generateUiBuilderComponents: any;
  let generateUiBuilderThemes: any;
  beforeEach(() => {
    context = {};
    schemas = {
      entities: [
        {
          resultType: 'SUCCESS',
          schemaName: 'testSchema',
          name: 'testSchema',
          schemaVersion: '1.0',
        },
      ],
    };
    listUiBuilderComponentsDependency_mock.listUiBuilderComponents = jest.fn().mockImplementation(() => schemas);
    listUiBuilderThemesDependency_mock.listUiBuilderThemes = jest.fn().mockImplementation(() => schemas);
    generateUiBuilderComponentsDependency_mock.generateUiBuilderComponents = jest.fn().mockImplementation(() => schemas.entities);
    generateUiBuilderThemesDependency_mock.generateUiBuilderThemes = jest.fn().mockImplementation(() => schemas.entities);
    generateAmplifyUiBuilderIndexFileDependency_mock.generateAmplifyUiBuilderIndexFile = jest.fn().mockImplementation(() => true);
  });
  it('runs generateComponents', async () => {
    await run(context);
    expect(generateUiBuilderComponentsDependency_mock.generateUiBuilderComponents).toBeCalledTimes(1);
    expect(generateUiBuilderThemesDependency_mock.generateUiBuilderThemes).toBeCalledTimes(1);
  });
});
