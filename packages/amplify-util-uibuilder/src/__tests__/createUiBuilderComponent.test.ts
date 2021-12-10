jest.mock('@aws-amplify/codegen-ui');
import * as codegen from '@aws-amplify/codegen-ui';
import {
  generateAmplifyUiBuilderIndexFile,
  createUiBuilderTheme,
  createUiBuilderComponent,
} from '../commands/utils/createUiBuilderComponent';
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
    // @ts-ignore
    codegen.StudioTemplateRendererManager = jest.fn().mockImplementation(() => ({
      renderSchemaToTemplate: renderSchemaToTemplateMock,
    }));
  });
  it('calls the renderManager', async () => {
    await createUiBuilderComponent(context, schema);
    // @ts-ignore
    expect(new codegen.StudioTemplateRendererManager().renderSchemaToTemplate).toBeCalled();
  });
  it('calls the renderManager for themes', async () => {
    await createUiBuilderTheme(context, schema);
    // @ts-ignore
    expect(new codegen.StudioTemplateRendererManager().renderSchemaToTemplate).toBeCalled();
  });
  it('calls the renderManager for index file', async () => {
    await generateAmplifyUiBuilderIndexFile(context, [schema]);
    // @ts-ignore
    expect(new codegen.StudioTemplateRendererManager().renderSchemaToTemplate).toBeCalled();
  });
});
