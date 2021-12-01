const { FrontendManagerTemplateRendererManager, FrontendManagerTemplateRendererFactory } = require('@aws-amplify/codegen-ui');
const {
  AmplifyRenderer,
  ReactThemeFrontendManagerTemplateRenderer,
  ReactIndexFrontendManagerTemplateRenderer,
  ModuleKind,
  ScriptTarget,
  ScriptKind,
} = require('@aws-amplify/codegen-ui-react');
const { getUiBuilderComponentsPath } = require('./getUiBuilderComponentsPath');
const logger = require('./logger');
const config = process.env.USE_CODEGEN_DEFAULTS
  ? {}
  : {
      module: ModuleKind.ESNext,
      target: ScriptTarget.ESNext,
      script: ScriptKind.JSX,
      renderTypeDeclarations: process.env.RENDER_TYPE_DECLARATIONS ? true : false,
    };

const createUiBuilderComponent = (context, schema) => {
  const uiBuilderComponentsPath = getUiBuilderComponentsPath(context);
  const rendererFactory = new FrontendManagerTemplateRendererFactory(component => new AmplifyRenderer(component, config));

  const outputPathDir = uiBuilderComponentsPath;
  const outputConfig = {
    outputPathDir,
  };

  const rendererManager = new FrontendManagerTemplateRendererManager(rendererFactory, outputConfig);

  rendererManager.renderSchemaToTemplate(schema);
  return schema;
};

const createUiBuilderTheme = (context, schema) => {
  const uiBuilderComponentsPath = getUiBuilderComponentsPath(context);
  const rendererFactory = new FrontendManagerTemplateRendererFactory(
    component => new ReactThemeFrontendManagerTemplateRenderer(component, config),
  );

  const outputPathDir = uiBuilderComponentsPath;
  const outputConfig = {
    outputPathDir,
  };

  const rendererManager = new FrontendManagerTemplateRendererManager(rendererFactory, outputConfig);

  try {
    rendererManager.renderSchemaToTemplate(schema);
    return schema;
  } catch (e) {
    logger.error(e);
    logger.info({ msg: 'Skipping invalid theme with schema', schema: JSON.stringify(schema, null, 2) });
    throw e;
  }
};

const generateAmplifyUiBuilderIndexFile = (context, schemas) => {
  const uiBuilderComponentsPath = getUiBuilderComponentsPath(context);
  const rendererFactory = new FrontendManagerTemplateRendererFactory(
    component => new ReactIndexFrontendManagerTemplateRenderer(component, config),
  );

  const outputPathDir = uiBuilderComponentsPath;
  const outputConfig = {
    outputPathDir,
  };

  const rendererManager = new FrontendManagerTemplateRendererManager(rendererFactory, outputConfig);

  try {
    rendererManager.renderSchemaToTemplate(schemas);
  } catch (e) {
    logger.error(e);
    logger.info({ msg: 'Failed to generate component index file' });
    throw e;
  }
};

module.exports = {
  createUiBuilderComponent,
  createUiBuilderTheme,
  generateAmplifyUiBuilderIndexFile,
};
