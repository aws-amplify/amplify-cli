import * as codegen from '@aws-amplify/codegen-ui-old';
import {
  generateAmplifyUiBuilderIndexFile,
  createUiBuilderTheme,
  createUiBuilderComponent,
} from '../commands/utils/createUiBuilderComponent';
jest.mock('@aws-amplify/codegen-ui-old');
const codegen_mock = codegen as any;
const renderSchemaToTemplateMock = jest.fn();

describe('can create a ui builder component', () => {
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
    codegen_mock.StudioTemplateRendererManager = jest.fn().mockImplementation(() => ({
      renderSchemaToTemplate: renderSchemaToTemplateMock,
    }));
  });
  it('calls the renderManager', async () => {
    await createUiBuilderComponent(context, schema);
    expect(new codegen_mock.StudioTemplateRendererManager().renderSchemaToTemplate).toBeCalled();
  });
  it('calls the renderManager for themes', async () => {
    await createUiBuilderTheme(context, schema);
    expect(new codegen_mock.StudioTemplateRendererManager().renderSchemaToTemplate).toBeCalled();
  });
  it('calls the renderManager for index file', async () => {
    await generateAmplifyUiBuilderIndexFile(context, [schema]);
    expect(new codegen_mock.StudioTemplateRendererManager().renderSchemaToTemplate).toBeCalled();
  });
});
