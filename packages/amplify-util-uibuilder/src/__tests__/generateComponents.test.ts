describe('can generate components', () => {
  let context: any;
  let schemas: any;
  let shouldRenderComponents: any;
  let notifyMissingPackages: any;
  let listUiBuilderComponents: any;
  let listUiBuilderThemes: any;
  let generateUiBuilderComponents: any;
  let generateUiBuilderThemes: any;
  let generateAmplifyUiBuilderIndexFile: any;
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
    jest.mock('../commands/utils/shouldRenderComponents');
    shouldRenderComponents = require('../commands/utils/shouldRenderComponents').shouldRenderComponents;
    shouldRenderComponents.mockImplementation(() => true);

    jest.mock('../commands/utils/notifyMissingPackages');
    notifyMissingPackages = require('../commands/utils/notifyMissingPackages').notifyMissingPackages;
    notifyMissingPackages.mockImplementation(() => true);

    jest.mock('../commands/utils/syncAmplifyUiBuilderComponents');
    jest.mock('../commands/utils/createUiBuilderComponent');
    listUiBuilderComponents = require('../commands/utils/syncAmplifyUiBuilderComponents').listUiBuilderComponents;
    generateUiBuilderComponents = require('../commands/utils/syncAmplifyUiBuilderComponents').generateUiBuilderComponents;
    generateUiBuilderThemes = require('../commands/utils/syncAmplifyUiBuilderComponents').generateUiBuilderThemes;
    listUiBuilderThemes = require('../commands/utils/syncAmplifyUiBuilderComponents').listUiBuilderThemes;
    generateAmplifyUiBuilderIndexFile = require('../commands/utils/createUiBuilderComponent').generateAmplifyUiBuilderIndexFile;
    listUiBuilderComponents.mockImplementation(() => schemas);
    listUiBuilderThemes.mockImplementation(() => schemas);
    generateUiBuilderComponents.mockImplementation(() => schemas.entities);
    generateUiBuilderThemes.mockImplementation(() => schemas.entities);
    generateAmplifyUiBuilderIndexFile.mockImplementation(() => true);
  });
  it('runs generateComponents', async () => {
    const { run } = require('../commands/generateComponents');
    await run(context);
  });
});
