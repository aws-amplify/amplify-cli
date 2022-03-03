import { StudioTemplateRendererManager, StudioTemplateRendererFactory, StudioComponent, StudioTheme, StudioTemplateRenderer, FrameworkOutputManager, RenderTextComponentResponse } from '@aws-amplify/codegen-ui-new';
import {
  AmplifyRenderer,
  ReactThemeStudioTemplateRenderer,
  ReactIndexStudioTemplateRenderer,
  ModuleKind,
  ScriptTarget,
  ScriptKind,
} from '@aws-amplify/codegen-ui-react-new';
import { getUiBuilderComponentsPath } from './getUiBuilderComponentsPath';
import { printer } from 'amplify-prompts';
import { $TSContext } from 'amplify-cli-core';
const config = {
  module: ModuleKind.ES2020,
  target: ScriptTarget.ES2020,
  script: ScriptKind.JSX,
  renderTypeDeclarations: true,
};

export const createUiBuilderComponent = (context: $TSContext, schema: StudioComponent) => {
  const uiBuilderComponentsPath = getUiBuilderComponentsPath(context);
  const rendererFactory = new StudioTemplateRendererFactory((component: StudioComponent) => new AmplifyRenderer(component, config) as unknown as StudioTemplateRenderer<unknown, StudioComponent, FrameworkOutputManager<unknown>, RenderTextComponentResponse>);

  const outputPathDir = uiBuilderComponentsPath;

  const rendererManager = new StudioTemplateRendererManager(rendererFactory, {
    outputPathDir,
  });

  rendererManager.renderSchemaToTemplate(schema);
  return schema;
};

export const createUiBuilderTheme = (context: $TSContext, schema: StudioTheme) => {
  const uiBuilderComponentsPath = getUiBuilderComponentsPath(context);
  const rendererFactory = new StudioTemplateRendererFactory((component: StudioTheme) => new ReactThemeStudioTemplateRenderer(component, config) as unknown as StudioTemplateRenderer<unknown, StudioTheme, FrameworkOutputManager<unknown>, RenderTextComponentResponse>);

  const outputPathDir = uiBuilderComponentsPath;

  const rendererManager = new StudioTemplateRendererManager(rendererFactory, {
    outputPathDir,
  });

  try {
    rendererManager.renderSchemaToTemplate(schema);
    return schema;
  } catch (e) {
    printer.debug(e);
    printer.debug('Skipping invalid theme with schema');
    printer.debug(JSON.stringify(schema, null, 2));
    throw e;
  }
};

export const generateAmplifyUiBuilderIndexFile = (context: $TSContext, schemas: StudioComponent[]) => {
  const uiBuilderComponentsPath = getUiBuilderComponentsPath(context);
  const rendererFactory = new StudioTemplateRendererFactory((component: StudioComponent[]) => new ReactIndexStudioTemplateRenderer(component, config) as unknown as StudioTemplateRenderer<unknown, StudioComponent[], FrameworkOutputManager<unknown>, RenderTextComponentResponse>);

  const outputPathDir = uiBuilderComponentsPath;

  const rendererManager = new StudioTemplateRendererManager(rendererFactory, {
    outputPathDir,
  });

  try {
    return rendererManager.renderSchemaToTemplate(schemas);
  } catch (e) {
    printer.debug(e);
    printer.debug('Failed to generate component index file');
    throw e;
  }
};
