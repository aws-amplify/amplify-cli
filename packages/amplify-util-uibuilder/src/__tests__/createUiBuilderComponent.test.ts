describe('can create a ui builder component', () => {
  let codegen: any;
  let context: any;
  let schema: any;
  beforeEach(() => {
    context = {
      exeInfo: {
        projectConfig: {
          providers: ['awscloudformation'],
          frontend: 'javascript',
          javascript: {
            framework: 'react',
            config: {
              SourceDir: 'src',
            },
          },
        },
      },
      parameters: {
        argv: [],
      },
      input: {},
    };
    schema = {
      appId: 'd37nrm8rzt3oek',
      bindingProperties: {},
      componentType: 'Box',
      environmentName: 'staging',
      id: 's-s4mU579Ycf6JGHwhqT',
      name: 'aawwdd',
      overrides: {},
      properties: {},
      variants: [],
    };
    jest.mock('@aws-amplify/codegen-ui');
    codegen = require('@aws-amplify/codegen-ui');
    const renderSchemaToTemplateMock = jest.fn();
    codegen.StudioTemplateRendererManager.mockImplementation(() => ({
      renderSchemaToTemplate: renderSchemaToTemplateMock,
    }));
  });
  it('calls the renderManager', async () => {
    const { createUiBuilderComponent } = require('../commands/utils/createUiBuilderComponent');
    await createUiBuilderComponent(context, schema);
    expect(new codegen.StudioTemplateRendererManager().renderSchemaToTemplate).toBeCalled();
  });
  it('calls the renderManager for themes', async () => {
    const { createUiBuilderTheme } = require('../commands/utils/createUiBuilderComponent');
    await createUiBuilderTheme(context, schema);
    expect(new codegen.StudioTemplateRendererManager().renderSchemaToTemplate).toBeCalled();
  });
  it('calls the renderManager for index file', async () => {
    const { generateAmplifyUiBuilderIndexFile } = require('../commands/utils/createUiBuilderComponent');
    await generateAmplifyUiBuilderIndexFile(context, [schema]);
    expect(new codegen.StudioTemplateRendererManager().renderSchemaToTemplate).toBeCalled();
  });
});
