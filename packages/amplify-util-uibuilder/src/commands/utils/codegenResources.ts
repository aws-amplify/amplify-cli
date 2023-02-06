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
  getGenericFromDataStore,
  StudioForm,
  StudioSchema,
} from '@aws-amplify/codegen-ui';
import {
  AmplifyRenderer,
  AmplifyFormRenderer,
  ReactThemeStudioTemplateRenderer,
  ReactIndexStudioTemplateRenderer,
  ModuleKind,
  ScriptTarget,
  ScriptKind,
  UtilTemplateType,
  ReactUtilsStudioTemplateRenderer,
  ReactThemeStudioTemplateRendererOptions,
} from '@aws-amplify/codegen-ui-react';
import { printer } from 'amplify-prompts';
import {
  $TSContext, AmplifyCategories, AmplifySupportedService, stateManager,
} from 'amplify-cli-core';
import { getUiBuilderComponentsPath } from './getUiBuilderComponentsPath';
import { AmplifyStudioClient } from '../../clients';

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
export const createUiBuilderTheme = (
  context: $TSContext,
  schema: StudioTheme,
  options?: ReactThemeStudioTemplateRendererOptions,
): StudioTheme => {
  const uiBuilderComponentsPath = getUiBuilderComponentsPath(context);
  const rendererFactory = new StudioTemplateRendererFactory(
    (component: StudioTheme) => (new ReactThemeStudioTemplateRenderer(component, config, options) as unknown) as StudioTemplateRenderer<
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
 * Writes form file to the work space
 */
export const createUiBuilderForm = (context: $TSContext, schema: StudioForm, dataSchema?: GenericDataSchema): StudioForm => {
  const uiBuilderComponentsPath = getUiBuilderComponentsPath(context);
  const rendererFactory = new StudioTemplateRendererFactory(
    (form: StudioForm) => (new AmplifyFormRenderer(form, dataSchema, config) as unknown) as StudioTemplateRenderer<
        unknown,
        StudioForm,
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
    printer.debug('Skipping invalid form with schema');
    printer.debug(JSON.stringify(schema, null, 2));
    throw e;
  }
};

/**
 * Writes index file to the work space
 */
export const generateAmplifyUiBuilderIndexFile = (context: $TSContext, schemas: StudioSchema[]): void => {
  const uiBuilderComponentsPath = getUiBuilderComponentsPath(context);
  const rendererFactory = new StudioTemplateRendererFactory(
    (schema: StudioSchema[]) => (new ReactIndexStudioTemplateRenderer(schema, config) as unknown) as StudioTemplateRenderer<
        unknown,
        StudioSchema[],
        FrameworkOutputManager<unknown>,
        RenderTextComponentResponse
      >,
  );

  const outputPathDir = uiBuilderComponentsPath;

  const rendererManager = new StudioTemplateRendererManager(rendererFactory, {
    outputPathDir,
  });

  try {
    if(schemas.length) {
      rendererManager.renderSchemaToTemplate(schemas);
    }
  } catch (e) {
    printer.debug(e);
    printer.debug('Failed to generate component index file');
    throw e;
  }
};

type UtilFileChecks = {
  hasForms: boolean;
  hasViews: boolean;
};

/**
 * Writes utils file to the work space
 */
export const generateAmplifyUiBuilderUtilFile = (context: $TSContext, { hasForms, hasViews }: UtilFileChecks): void => {
  const uiBuilderComponentsPath = getUiBuilderComponentsPath(context);
  const rendererFactory = new StudioTemplateRendererFactory(
    (utils: UtilTemplateType[]) => (new ReactUtilsStudioTemplateRenderer(utils, config)),
  );

  const outputPathDir = uiBuilderComponentsPath;

  const rendererManager = new StudioTemplateRendererManager(rendererFactory, {
    outputPathDir,
  });

  const utils = new Set<UtilTemplateType>();

  if (hasForms) {
    utils.add('validation');
    utils.add('formatter');
    utils.add('fetchByPath');
  }

  if (hasViews) {
    utils.add('formatter');
  }

  try {
    if (utils.size) {
      rendererManager.renderSchemaToTemplate([...utils]);
    }
  } catch (e) {
    printer.debug(e);
    printer.debug('Failed to generate component index file');
    throw e;
  }
};

/**
 * If models are available, they will be populated in the models field of the returned object.
 * If they're not available, it will return undefined
 */
export const getAmplifyDataSchema = async (
  studioClient: AmplifyStudioClient,
): Promise<GenericDataSchema | undefined> => {
  if (!studioClient.isGraphQLSupported) {
    return undefined;
  }
  try {
    const meta = stateManager.getMeta();
    const resourceName = Object.entries(meta[AmplifyCategories.API]).find(
      ([, value]) => (value as { service: string }).service === AmplifySupportedService.APPSYNC,
    )?.[0];
    if (resourceName) {
      const model = await studioClient.getModels(resourceName);
      if (model) {
        const source = model.replace(model.substring(0, model.indexOf(`{`) - 1), ``).replace(/;/g, ``);
        return getGenericFromDataStore(JSON.parse(source));
      }
    }
    printer.debug(`Provided ResourceName: ${resourceName} did not yield Models.`);
    return undefined;
  } catch (error) {
    printer.debug(error.toString());
    return undefined;
  }
};

/**
 * generates base create/update froms from names
 */
export const generateBaseForms = (modelMap: {[model: string]: Set<'create' | 'update'>}): StudioForm[] => {
  const getSchema = (name: string, type: 'create' | 'update') : StudioForm => ({
    name: `${name}${type === 'create' ? 'CreateForm' : 'UpdateForm'}`,
    formActionType: type,
    dataType: { dataSourceType: 'DataStore', dataTypeName: name },
    fields: {},
    sectionalElements: {},
    style: {},
    cta: {},
  });

  const schemas : StudioForm[] = [];

  Object.entries(modelMap).forEach(([name, set]) => {
    set.forEach(type => schemas.push(getSchema(name, type)));
  });
  return schemas;
};
