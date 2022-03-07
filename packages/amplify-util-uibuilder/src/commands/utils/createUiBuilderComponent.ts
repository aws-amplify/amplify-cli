import { StudioTemplateRendererManager, StudioComponent, StudioTemplateRendererFactory, StudioTemplateRenderer, FrameworkOutputManager, RenderTextComponentResponse } from '@aws-amplify/codegen-ui-old';
import {
  AmplifyRenderer,
  ReactThemeStudioTemplateRenderer,
  ModuleKind,
  ScriptTarget,
  ScriptKind,
} from '@aws-amplify/codegen-ui-react-old';

import {StudioComponent as StudioComponentNew, StudioTheme} from '@aws-amplify/codegen-ui-new';
import { getUiBuilderComponentsPath } from './getUiBuilderComponentsPath';
import { printer } from 'amplify-prompts';
import { $TSContext } from 'amplify-cli-core';
import { createUiBuilderComponent as createUiBuilderComponentNew } from './createUiBuilderComponentNew';
import { ReactIndexStudioTemplateRenderer } from '@aws-amplify/codegen-ui-react-new';
const config = {
  module: ModuleKind.ES2020,
  target: ScriptTarget.ES2020,
  script: ScriptKind.JSX,
  renderTypeDeclarations: true,
};

const isUpdatedSchema = (schema: StudioComponent) => {
  return (schema as unknown as StudioComponentNew).schemaVersion && (schema as unknown as StudioComponentNew).schemaVersion === '1.0';
};

export const createUiBuilderComponent = (context: $TSContext, schema: StudioComponent) => {
  if (isUpdatedSchema(schema)) {
    return createUiBuilderComponentNew(context, schema as unknown as StudioComponentNew);
  }
  const uiBuilderComponentsPath = getUiBuilderComponentsPath(context);
  const rendererFactory = new StudioTemplateRendererFactory(
    (component: StudioComponent) =>
      new AmplifyRenderer(component as StudioComponent, config) as unknown as StudioTemplateRenderer<
        unknown,
        StudioComponent,
        FrameworkOutputManager<unknown>,
        RenderTextComponentResponse
      >,
  );

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

export const generateAmplifyUiBuilderIndexFile = (context: $TSContext, schemas: StudioComponentNew[]) => {
  const uiBuilderComponentsPath = getUiBuilderComponentsPath(context);
  const rendererFactory = new StudioTemplateRendererFactory((component: StudioComponentNew[]) => new ReactIndexStudioTemplateRenderer(component, config) as unknown as StudioTemplateRenderer<unknown, StudioComponentNew[], FrameworkOutputManager<unknown>, RenderTextComponentResponse>);

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
  }};
