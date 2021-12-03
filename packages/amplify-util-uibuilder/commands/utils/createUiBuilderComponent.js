const { StudioTemplateRendererManager, StudioTemplateRendererFactory } = require('@aws-amplify/codegen-ui');
const {
  AmplifyRenderer,
  ReactThemeStudioTemplateRenderer,
  ReactIndexStudioTemplateRenderer,
  ModuleKind,
  ScriptTarget,
  ScriptKind,
} = require('@aws-amplify/codegen-ui-react');
const { getUiBuilderComponentsPath } = require('./getUiBuilderComponentsPath');
const { printer } = require('amplify-prompts');
const config = {
  module: ModuleKind.ES2020,
  target: ScriptTarget.ES2020,
  script: ScriptKind.JSX,
  renderTypeDeclarations: true,
};

const createUiBuilderComponent = (context, schema) => {
  const uiBuilderComponentsPath = getUiBuilderComponentsPath(context);
  const rendererFactory = new StudioTemplateRendererFactory(component => new AmplifyRenderer(component, config));

  const outputPathDir = uiBuilderComponentsPath;
  const outputConfig = {
    outputPathDir,
  };

  const rendererManager = new StudioTemplateRendererManager(rendererFactory, outputConfig);

  rendererManager.renderSchemaToTemplate(schema);
  return schema;
};

const createUiBuilderTheme = (context, schema) => {
  const uiBuilderComponentsPath = getUiBuilderComponentsPath(context);
  const rendererFactory = new StudioTemplateRendererFactory(component => new ReactThemeStudioTemplateRenderer(component, config));

  const outputPathDir = uiBuilderComponentsPath;
  const outputConfig = {
    outputPathDir,
  };

  const rendererManager = new StudioTemplateRendererManager(rendererFactory, outputConfig);

  try {
    rendererManager.renderSchemaToTemplate(schema);
    return schema;
  } catch (e) {
    printer.debug(e);
    printer.debug({ msg: 'Skipping invalid theme with schema', schema: JSON.stringify(schema, null, 2) });
    throw e;
  }
};

const generateAmplifyUiBuilderIndexFile = (context, schemas) => {
  const uiBuilderComponentsPath = getUiBuilderComponentsPath(context);
  const rendererFactory = new StudioTemplateRendererFactory(component => new ReactIndexStudioTemplateRenderer(component, config));

  const outputPathDir = uiBuilderComponentsPath;
  const outputConfig = {
    outputPathDir,
  };

  const rendererManager = new StudioTemplateRendererManager(rendererFactory, outputConfig);

  try {
    rendererManager.renderSchemaToTemplate(schemas);
  } catch (e) {
    printer.debug(e);
    printer.debug({ msg: 'Failed to generate component index file' });
    throw e;
  }
};

module.exports = {
  createUiBuilderComponent,
  createUiBuilderTheme,
  generateAmplifyUiBuilderIndexFile,
};
