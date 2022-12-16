/* eslint-disable spellcheck/spell-checker */
import * as codegen from '@aws-amplify/codegen-ui'; // eslint-disable-line import/no-extraneous-dependencies
import {
  generateAmplifyUiBuilderIndexFile,
  createUiBuilderTheme,
  createUiBuilderComponent,
  createUiBuilderForm,
  generateAmplifyUiBuilderUtilFile,
} from '../commands/utils/codegenResources';

jest.mock('@aws-amplify/codegen-ui');
const codegenMock = codegen as any;

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
    const renderSchemaToTemplateMock = jest.fn();
    codegenMock.StudioTemplateRendererManager = jest.fn().mockReturnValue({
      renderSchemaToTemplate: renderSchemaToTemplateMock,
    });
  });
  it('calls the renderManager', () => {
    createUiBuilderComponent(context, schema);
    expect(new codegenMock.StudioTemplateRendererManager().renderSchemaToTemplate).toBeCalled();
  });
  it('calls the renderManager for themes', () => {
    createUiBuilderTheme(context, schema);
    expect(new codegenMock.StudioTemplateRendererManager().renderSchemaToTemplate).toBeCalled();
  });
  it('calls the renderManager for default theme', () => {
    createUiBuilderTheme(context, schema, { renderDefaultTheme: true });
    expect(new codegenMock.StudioTemplateRendererManager().renderSchemaToTemplate).toBeCalled();
  });
  it('calls the renderManager for forms', () => {
    createUiBuilderForm(context, schema);
    expect(new codegenMock.StudioTemplateRendererManager().renderSchemaToTemplate).toBeCalled();
  });
  it('calls the renderManager for index file', () => {
    generateAmplifyUiBuilderIndexFile(context, [schema]);
    expect(new codegenMock.StudioTemplateRendererManager().renderSchemaToTemplate).toBeCalled();
  });
  it('does not call renderSchemaToTemplate for index file if no schema', () => {
    generateAmplifyUiBuilderIndexFile(context, []);
    expect(new codegenMock.StudioTemplateRendererManager().renderSchemaToTemplate).not.toBeCalled();
  })
  it('calls the renderManager for utils file w/ validation, formatter, and fetchByPath helpers if there is a form', () => {
    generateAmplifyUiBuilderUtilFile(context, { hasForms: true, hasViews: false });
    expect(new codegenMock.StudioTemplateRendererManager().renderSchemaToTemplate).toBeCalledWith(expect.arrayContaining(['validation', 'formatter', 'fetchByPath']));
  });
  it('calls the renderManager for utils file w/ formatter helper if there is a view', () => {
    generateAmplifyUiBuilderUtilFile(context, { hasForms: false, hasViews: true });
    expect(new codegenMock.StudioTemplateRendererManager().renderSchemaToTemplate).toBeCalledWith(['formatter']);
  });
  it('should not call the renderManager for utils file if there is neither form nor views', () => {
    generateAmplifyUiBuilderUtilFile(context, { hasForms: false, hasViews: false });
    expect(new codegenMock.StudioTemplateRendererManager().renderSchemaToTemplate).toBeCalledTimes(0);
  });
});
