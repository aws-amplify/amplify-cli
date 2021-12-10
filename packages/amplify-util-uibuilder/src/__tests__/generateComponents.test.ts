jest.mock('../commands/utils/shouldRenderComponents');
import * as shouldRenderComponentsDependency from '../commands/utils/shouldRenderComponents';
// @ts-ignore
shouldRenderComponentsDependency.shouldRenderComponents = jest.fn().mockImplementation(() => true);

jest.mock('../commands/utils/notifyMissingPackages');
import * as notifyMissingPackagesDependency from '../commands/utils/notifyMissingPackages';
// @ts-ignore
notifyMissingPackagesDependency.notifyMissingPackages = jest.fn().mockImplementation(() => true);

jest.mock('../commands/utils/syncAmplifyUiBuilderComponents');
jest.mock('../commands/utils/createUiBuilderComponent');
import * as listUiBuilderComponentsDependency from '../commands/utils/syncAmplifyUiBuilderComponents';
import * as generateUiBuilderComponentsDependency from '../commands/utils/syncAmplifyUiBuilderComponents';
import * as generateUiBuilderThemesDependency from '../commands/utils/syncAmplifyUiBuilderComponents';
import * as listUiBuilderThemesDependency from '../commands/utils/syncAmplifyUiBuilderComponents';
import * as generateAmplifyUiBuilderIndexFileDependency from '../commands/utils/createUiBuilderComponent';
import { run } from '../commands/generateComponents';

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
        },
      ],
    };
    // @ts-ignore
    listUiBuilderComponentsDependency.listUiBuilderComponents = jest.fn().mockImplementation(() => schemas);
    // @ts-ignore
    listUiBuilderThemesDependency.listUiBuilderThemes = jest.fn().mockImplementation(() => schemas);
    // @ts-ignore
    generateUiBuilderComponentsDependency.generateUiBuilderComponents = jest.fn().mockImplementation(() => schemas.entities);
    // @ts-ignore
    generateUiBuilderThemesDependency.generateUiBuilderThemes = jest.fn().mockImplementation(() => schemas.entities);
    // @ts-ignore
    generateAmplifyUiBuilderIndexFileDependency.generateAmplifyUiBuilderIndexFile = jest.fn().mockImplementation(() => true);
  });
  it('runs generateComponents', async () => {
    await run(context);
    expect(generateUiBuilderComponentsDependency.generateUiBuilderComponents).toBeCalledTimes(1);
    expect(generateUiBuilderThemesDependency.generateUiBuilderThemes).toBeCalledTimes(1);
  });
});
