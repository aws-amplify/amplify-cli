import * as shouldRenderComponentsDependency from '../commands/utils/shouldRenderComponents';
import * as notifyMissingPackagesDependency from '../commands/utils/notifyMissingPackages';
import * as listUiBuilderComponentsDependency from '../commands/utils/syncAmplifyUiBuilderComponents';
import * as generateUiBuilderComponentsDependency from '../commands/utils/syncAmplifyUiBuilderComponents';
import * as generateUiBuilderThemesDependency from '../commands/utils/syncAmplifyUiBuilderComponents';
import * as syncAmplifyBackendModelsDependency from '../commands/utils/getAmplifyDataSchema';
import * as listUiBuilderThemesDependency from '../commands/utils/syncAmplifyUiBuilderComponents';
import * as generateAmplifyUiBuilderIndexFileDependency from '../commands/utils/createUiBuilderComponent';
import { run } from '../commands/generateComponents';

jest.mock('../commands/utils/syncAmplifyUiBuilderComponents');
jest.mock('../commands/utils/createUiBuilderComponent');
jest.mock('../commands/utils/shouldRenderComponents');
jest.mock('../commands/utils/notifyMissingPackages');
jest.mock('../clients', () => ({
  AmplifyClientFactory: {
    setClientInfo: jest.fn(),
    amplifyUiBuilder: {
      createComponent: () => ({
        promise: () => true,
      }),
    },
    amplifyBackend: jest.fn(),
  },
}));

const shouldRenderComponentsDependencyMock = shouldRenderComponentsDependency as any;
const notifyMissingPackagesDependencyMock = notifyMissingPackagesDependency as any;
const listUiBuilderComponentsDependencyMock = listUiBuilderComponentsDependency as any;
const generateUiBuilderComponentsDependencyMock = generateUiBuilderComponentsDependency as any;
const generateUiBuilderThemesDependencyMock = generateUiBuilderThemesDependency as any;
const syncAmplifyBackendModelsDependencyMock = syncAmplifyBackendModelsDependency as any;
const listUiBuilderThemesDependencyMock = listUiBuilderThemesDependency as any;
const generateAmplifyUiBuilderIndexFileDependencyMock = generateAmplifyUiBuilderIndexFileDependency as any;

shouldRenderComponentsDependencyMock.shouldRenderComponents = jest.fn().mockImplementation(() => true);
notifyMissingPackagesDependencyMock.notifyMissingPackages = jest.fn().mockImplementation(() => true);

describe('can generate components', () => {
  let context: any;
  let schemas: any;
  beforeEach(() => {
    context = {
      input: {
        options: {
          appId: 'testAppId',
          envName: 'testEnvName',
        },
      },
    };
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
    listUiBuilderComponentsDependencyMock.listUiBuilderComponents = jest.fn().mockImplementation(() => schemas);
    listUiBuilderThemesDependencyMock.listUiBuilderThemes = jest.fn().mockImplementation(() => schemas);
    generateUiBuilderComponentsDependencyMock.generateUiBuilderComponents = jest.fn().mockImplementation(() => schemas.entities);
    generateUiBuilderThemesDependencyMock.generateUiBuilderThemes = jest.fn().mockImplementation(() => schemas.entities);
    syncAmplifyBackendModelsDependencyMock.getAmplifyBackendModels = jest.fn().mockImplementation(() => ({
      models: {
        Blog: {
          id: {
            name: 'id',
            isArray: false,
            type: 'ID',
            isRequired: true,
            attributes: [],
          },
        },
      },
    }));
    generateAmplifyUiBuilderIndexFileDependencyMock.generateAmplifyUiBuilderIndexFile = jest.fn().mockImplementation(() => true);
  });

  it('runs generateComponents', async () => {
    await run(context);
    expect(generateUiBuilderComponentsDependencyMock.generateUiBuilderComponents).toBeCalledTimes(1);
    expect(generateUiBuilderThemesDependencyMock.generateUiBuilderThemes).toBeCalledTimes(1);
  });
});
