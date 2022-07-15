import * as codegen from '@aws-amplify/codegen-ui'; // eslint-disable-line import/no-extraneous-dependencies
import {
  generateAmplifyUiBuilderIndexFile,
  createUiBuilderTheme,
  createUiBuilderComponent,
} from '../commands/utils/codegenResources';

jest.mock('@aws-amplify/codegen-ui');
const codegenMock = codegen as any;
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
    codegenMock.StudioTemplateRendererManager = jest.fn().mockImplementation(() => ({
      renderSchemaToTemplate: renderSchemaToTemplateMock,
    }));
  });
  it('calls the renderManager', () => {
    createUiBuilderComponent(context, schema);
    expect(new codegenMock.StudioTemplateRendererManager().renderSchemaToTemplate).toBeCalled();
  });
  it('calls the renderManager for themes', () => {
    createUiBuilderTheme(context, schema);
    expect(new codegenMock.StudioTemplateRendererManager().renderSchemaToTemplate).toBeCalled();
  });
  it('calls the renderManager for index file', () => {
    generateAmplifyUiBuilderIndexFile(context, [schema]);
    expect(new codegenMock.StudioTemplateRendererManager().renderSchemaToTemplate).toBeCalled();
  });
});
