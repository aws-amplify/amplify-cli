import { printer } from 'amplify-prompts';
import { $TSContext } from 'amplify-cli-core';
import {
  StudioComponent, StudioTheme, GenericDataSchema, StudioForm, StudioSchema,checkIsSupportedAsForm
} from '@aws-amplify/codegen-ui';
import {
  createUiBuilderComponent,
  createUiBuilderForm,
  createUiBuilderTheme,
  generateBaseForms,
} from './codegenResources';
import { getUiBuilderComponentsPath } from './getUiBuilderComponentsPath';

type CodegenResponse<T extends StudioSchema> =
  | {
      resultType: 'SUCCESS';
      schema: T;
      schemaName?: string;
    }
  | {
      resultType: 'FAILURE';
      schemaName: string;
      error: Error;
      schema?: T;
    };

/**
 * Returns instances of StudioComponent from the component schemas
 */
export const generateUiBuilderComponents = (
  context: $TSContext,
  componentSchemas: any[], // eslint-disable-line @typescript-eslint/no-explicit-any
  dataSchema?: GenericDataSchema,
): CodegenResponse<StudioComponent>[] => {
  const componentResults = componentSchemas.map<CodegenResponse<StudioComponent>>(schema => {
    try {
      const component = createUiBuilderComponent(context, schema, dataSchema);
      return { resultType: 'SUCCESS', schema: component };
    } catch (e) {
      printer.debug(`Failure caught processing ${schema.name}`);
      printer.debug(e);
      return { resultType: 'FAILURE', schemaName: schema.name, error: e };
    }
  });

  printer.debug(
    `Generated ${componentResults.filter(result => result.resultType === 'SUCCESS').length} components in ${getUiBuilderComponentsPath(
      context,
    )}`,
  );
  return componentResults;
};

/**
 * Returns instances of StudioTheme from theme schemas
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const generateUiBuilderThemes = (context: $TSContext, themeSchemas: any[]): CodegenResponse<StudioTheme>[] => {
  const themeResults = themeSchemas.map<CodegenResponse<StudioTheme>>(schema => {
    try {
      const theme = createUiBuilderTheme(context, schema);
      return { resultType: 'SUCCESS', schema: theme };
    } catch (e) {
      printer.debug(`Failure caught processing ${schema.name}`);
      printer.debug(e);
      return { resultType: 'FAILURE', schemaName: schema.name, error: e };
    }
  });

  printer.debug(
    `Generated ${themeResults.filter(result => result.resultType === 'SUCCESS').length} themes in ${getUiBuilderComponentsPath(context)}`,
  );
  return themeResults;
};

/**
 * Returns instances of StudioForm from form schemas
 */
export const generateUiBuilderForms = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: $TSContext,
  formSchemas: any[],
  dataSchema?: GenericDataSchema,
  autoGenerateForms?: boolean,
): CodegenResponse<StudioForm>[] => {
  const modelMap: { [model: string]: Set<'create' | 'update'> } = {};
  if (dataSchema?.dataSourceType === 'DataStore' && autoGenerateForms) {
    Object.entries(dataSchema.models).forEach(([name, model]) => {
      if(checkIsSupportedAsForm(model) && !model.isJoinTable) {
        modelMap[name] = new Set(['create', 'update']);
      }
    });
  }
  const codegenForm = (schema: StudioForm): CodegenResponse<StudioForm> => {
    try {
      const form = createUiBuilderForm(context, schema, dataSchema);
      return { resultType: 'SUCCESS', schema: form };
    } catch (e) {
      printer.debug(`Failure caught processing ${schema.name}`);
      printer.debug(e);
      return { resultType: 'FAILURE', schemaName: schema.name, error: e };
    }
  };
  const formResults = formSchemas.map((schema: StudioForm) => {
    if (schema?.dataType && schema.dataType?.dataSourceType === 'DataStore') {
      modelMap[schema.dataType.dataTypeName]?.delete(schema.formActionType);
    }
    return codegenForm(schema);
  });

  // append remaining models
  formResults.push(...generateBaseForms(modelMap).map(codegenForm));

  printer.debug(
    `Generated ${formResults.filter(result => result.resultType === 'SUCCESS').length} forms in ${getUiBuilderComponentsPath(context)}`,
  );
  return formResults;
};
