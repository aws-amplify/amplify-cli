const context = {
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
const schema = {
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

describe('should create ui builder components', () => {
  let codegen;
  beforeEach(() => {
    jest.mock('../../../aws-amplify-codegen-ui');
    codegen = require('../../../aws-amplify-codegen-ui');
    const renderSchemaToTemplateMock = jest.fn();
    codegen.FrontendManagerTemplateRendererManager.mockImplementation(() => ({
      renderSchemaToTemplate: renderSchemaToTemplateMock,
    }));
  });
  it('calls the renderManager', async () => {
    const { createUiBuilderComponent } = require('../createUiBuilderComponent');
    await createUiBuilderComponent(context, schema);
    expect(new codegen.FrontendManagerTemplateRendererManager().renderSchemaToTemplate).toBeCalled();
  });
});
