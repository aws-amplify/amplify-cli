/* eslint-disable spellcheck/spell-checker*/
// You have a misspelled word: Renderer on Identifier
import {
  StudioTemplateRendererManager,
  StudioComponent,
  StudioTheme,
  StudioTemplateRendererFactory,
  StudioTemplateRenderer,
  FrameworkOutputManager,
  RenderTextComponentResponse,
  GenericDataSchema,
} from '@aws-amplify/codegen-ui';
import {
  AmplifyRenderer,
  ReactThemeStudioTemplateRenderer,
  ReactIndexStudioTemplateRenderer,
  ModuleKind,
  ScriptTarget,
  ScriptKind,
} from '@aws-amplify/codegen-ui-react';

import { printer } from 'amplify-prompts';
import { $TSContext } from 'amplify-cli-core';
import { getUiBuilderComponentsPath } from './getUiBuilderComponentsPath';

const config = {
  module: ModuleKind.ES2020,
  target: ScriptTarget.ES2020,
  script: ScriptKind.JSX,
  renderTypeDeclarations: true,
};

/**
 * Writes component file to the work space
 */
export const createUiBuilderComponent = (context: $TSContext, schema: StudioComponent, dataSchema?: GenericDataSchema): StudioComponent => {
  const uiBuilderComponentsPath = getUiBuilderComponentsPath(context);
  const rendererFactory = new StudioTemplateRendererFactory(
    (component: StudioComponent) => new AmplifyRenderer(component as StudioComponent, config, dataSchema),
  );

  const outputPathDir = uiBuilderComponentsPath;

  const rendererManager = new StudioTemplateRendererManager(rendererFactory, {
    outputPathDir,
  });

  rendererManager.renderSchemaToTemplate(schema);
  return schema;
};

/**
 * Writes theme file to the work space
 */
export const createUiBuilderTheme = (context: $TSContext, schema: StudioTheme): StudioTheme => {
  const uiBuilderComponentsPath = getUiBuilderComponentsPath(context);
  const rendererFactory = new StudioTemplateRendererFactory(
    (component: StudioTheme) => (new ReactThemeStudioTemplateRenderer(component, config) as unknown) as StudioTemplateRenderer<
        unknown,
        StudioTheme,
        FrameworkOutputManager<unknown>,
        RenderTextComponentResponse
      >,
  );

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

/**
 * Writes index file to the work space
 */
export const generateAmplifyUiBuilderIndexFile = (context: $TSContext, schemas: StudioComponent[]): RenderTextComponentResponse => {
  const uiBuilderComponentsPath = getUiBuilderComponentsPath(context);
  const rendererFactory = new StudioTemplateRendererFactory(
    (component: StudioComponent[]) => (new ReactIndexStudioTemplateRenderer(component, config) as unknown) as StudioTemplateRenderer<
        unknown,
        StudioComponent[],
        FrameworkOutputManager<unknown>,
        RenderTextComponentResponse
      >,
  );

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
