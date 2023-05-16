import { printer } from '@aws-amplify/amplify-prompts';
import { $TSContext } from '@aws-amplify/amplify-cli-core';
import {
  StudioComponent,
  StudioTheme,
  GenericDataSchema,
  StudioForm,
  StudioSchema,
  checkIsSupportedAsForm,
  FormFeatureFlags,
  GenericDataModel,
  GenericDataNonModel,
  GenericDataField,
  GenericDataRelationshipType,
} from '@aws-amplify/codegen-ui';
import { createUiBuilderComponent, createUiBuilderForm, createUiBuilderTheme, generateBaseForms } from './codegenResources';
import { getUiBuilderComponentsPath } from './getUiBuilderComponentsPath';
import fetch from 'node-fetch';
import extract from 'extract-zip';
import fs from 'fs';
import path from 'path';
import { CodegenGenericDataEnum, CodegenGenericDataFieldDataType, CodegenGenericDataFields, CodegenGenericDataModel, CodegenGenericDataNonModel, CodegenGenericDataRelationshipType, CodegenJob, CodegenJobGenericDataSchema } from '../../local_modules/aws-sdk/clients/amplifyuibuilder';

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

// TODO: when types are updated in codegen-ui reference mappers here so the arguments accepted are not any

/**
 * Returns instances of StudioComponent from the component schemas
 */
export const generateUiBuilderComponents = (
  context: $TSContext,
  componentSchemas: any[], // eslint-disable-line @typescript-eslint/no-explicit-any
  dataSchema?: GenericDataSchema,
): CodegenResponse<StudioComponent>[] => {
  const componentResults = componentSchemas.map<CodegenResponse<StudioComponent>>((schema) => {
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
    `Generated ${componentResults.filter((result) => result.resultType === 'SUCCESS').length} components in ${getUiBuilderComponentsPath(
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
  if (themeSchemas.length === 0) {
    return [generateDefaultTheme(context)];
  }
  const themeResults = themeSchemas.map<CodegenResponse<StudioTheme>>((schema) => {
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
    `Generated ${themeResults.filter((result) => result.resultType === 'SUCCESS').length} themes in ${getUiBuilderComponentsPath(context)}`,
  );
  return themeResults;
};

/**
 * Generates the defaultTheme in the user's project that's exported from @aws-amplify/codegen-ui-react
 */
const generateDefaultTheme = (context: $TSContext): CodegenResponse<StudioTheme> => {
  try {
    const theme = createUiBuilderTheme(context, { name: 'studioTheme', values: [] }, { renderDefaultTheme: true });
    printer.debug(`Generated default theme in ${getUiBuilderComponentsPath(context)}`);
    return { resultType: 'SUCCESS', schema: theme };
  } catch (e) {
    printer.debug(`Failure caught rendering default theme`);
    printer.debug(e);
    return { resultType: 'FAILURE', schemaName: 'studioTheme', error: e };
  }
};

/**
 * Returns instances of StudioForm from form schemas
 */
export const generateUiBuilderForms = (
  context: $TSContext,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formSchemas: any[],
  dataSchema?: GenericDataSchema,
  autoGenerateForms?: boolean,
  formFeatureFlags?: FormFeatureFlags,
): CodegenResponse<StudioForm>[] => {
  const modelMap: { [model: string]: Set<'create' | 'update'> } = {};
  if (dataSchema?.dataSourceType === 'DataStore' && autoGenerateForms) {
    Object.entries(dataSchema.models).forEach(([name, model]) => {
      if (checkIsSupportedAsForm(model, formFeatureFlags) && !model.isJoinTable) {
        modelMap[name] = new Set(['create', 'update']);
      }
    });
  }
  const codegenForm = (schema: StudioForm): CodegenResponse<StudioForm> => {
    try {
      const form = createUiBuilderForm(context, schema, dataSchema, formFeatureFlags);
      return { resultType: 'SUCCESS', schema: form };
    } catch (e) {
      printer.debug(`Failure caught processing ${schema.name}`);
      printer.debug(e);
      return {
        resultType: 'FAILURE',
        schemaName: schema.name,
        schema,
        error: e,
      };
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
    `Generated ${formResults.filter((result) => result.resultType === 'SUCCESS').length} forms in ${getUiBuilderComponentsPath(context)}`,
  );
  return formResults;
};

export const extractUIComponents = async (url: string, uiBuilderComponentsPath: string) => {
  const zipFilePath = path.join(uiBuilderComponentsPath, 'ui-components.zip');

  try {
    if (!fs.existsSync(uiBuilderComponentsPath)) {
      fs.mkdirSync(uiBuilderComponentsPath, {recursive: true});
    }

    const response = await fetch(url);
    const zipBuffer = await response.buffer();
    
    fs.writeFileSync(zipFilePath, zipBuffer);
    
    await extract(zipFilePath, {dir: uiBuilderComponentsPath});
    printer.debug('ui-components zip file downloaded and extracted successfully');
  } catch (error) {
    printer.debug('ui-components zip file failed downloading or extracting');
  } finally {
    if (fs.existsSync(zipFilePath)) {
      // fs.unlinkSync(zipFilePath);
      printer.debug('deleted temp ui-components zip file');
    }
  }
}

export const pollCodegenJob = async (id: string, getJob: (jobId: string, appId?: string | undefined, envName?: string | undefined) => Promise<CodegenJob>) => {
  const pollInterval = 2000;
  // Temp timeout value for testing
  const tenSecondsTimeout = 1000 * 60;

  const timeoutPromise = new Promise((res, reject) => {
    setTimeout(() => {
      reject(new Error('Codegen Job polling timeout'));
    }, tenSecondsTimeout);
  });

  const isCodegenJob = (job: unknown): job is CodegenJob => {
    return (job !== null && typeof job === 'object' && 'status' in job);
  }

  while (true) {
    try {
      const response = await Promise.race([getJob(id), timeoutPromise]);
      if (isCodegenJob(response)) {
        if (response.status === 'failed') {
          throw new Error(response.statusMessage);
        }
        if (response.status === 'succeeded') {
          return response;
        }
      }
      await new Promise((res) => setTimeout(res, pollInterval));
    } catch (error) {
      printer.debug('Failed polling for codegen job');
      printer.debug(error);
      throw error;
    }
  }
}

const mapRelationshipTypeToCodegen = (relationship: GenericDataRelationshipType | undefined): CodegenGenericDataRelationshipType | undefined => {
  if (!relationship) return undefined;

  switch (relationship.type) {
    case 'HAS_MANY':
      return {
        type: 'HAS_MANY',
        relatedModelFields: relationship.relatedModelFields,
        canUnlinkAssociatedModel: !!relationship.canUnlinkAssociatedModel,
        relatedJoinFieldName: relationship.relatedJoinFieldName,
        relatedJoinTableName: relationship.relatedJoinTableName,
        belongsToFieldOnRelatedModel: relationship.belongsToFieldOnRelatedModel,
        relatedModelName: relationship.relatedModelName,
      };
    case 'HAS_ONE':
      return {
        type: 'HAS_ONE',
        associatedFields: relationship.associatedFields,
        isHasManyIndex: !!relationship.isHasManyIndex,
        relatedModelName: relationship.relatedModelName,
      };
    case 'BELONGS_TO':
      return {
        type: 'BELONGS_TO',
        associatedFields: relationship.associatedFields,
        isHasManyIndex: !!relationship.isHasManyIndex,
        relatedModelName: relationship.relatedModelName,
      };
    default:
      throw new Error('Invalid relationship type');
  }
};

const mapDataFieldsToCodegen = (fields: { [fieldName: string]: GenericDataField }): CodegenGenericDataFields => {
  const codegenFields: CodegenGenericDataFields = {};

  Object.entries(fields).forEach(([fieldName, dataField]) => {
    let dataType: CodegenGenericDataFieldDataType = '';
    let dataTypeValue = '';
    if (typeof dataField.dataType === 'object' && dataField.dataType !== null) {
      if ('enum' in dataField.dataType) {
        dataType = 'Enum';
        dataTypeValue = dataField.dataType.enum;
      } else if ('model' in dataField.dataType) {
        dataType = 'Model';
        dataTypeValue = dataField.dataType.model
      } else if ('nonModel' in dataField.dataType) {
        dataType = 'NonModel';
        dataTypeValue = dataField.dataType.nonModel
      }
    } else {
      dataType = dataField.dataType;
      dataTypeValue = dataField.dataType;
    }
    codegenFields[fieldName] = {
      dataType: dataType,
      dataTypeValue: dataTypeValue,
      required: dataField.required,
      readOnly: dataField.readOnly,
      isArray: dataField.isArray,
    };
    if (dataField.relationship) {
      codegenFields[fieldName].relationship = mapRelationshipTypeToCodegen(dataField.relationship)
    }
  });

  return codegenFields;
};

export const mapGenericDataSchemaToCodegen = (
  genericDataSchema: GenericDataSchema
): CodegenJobGenericDataSchema => {
  const { models, nonModels, enums, dataSourceType } = genericDataSchema;
  const codegenModels: {[key: string]: CodegenGenericDataModel} = {};
  const codegenNonModels: {[key: string]: CodegenGenericDataNonModel} = {};
  const codegenEnums: {[key: string]: CodegenGenericDataEnum} = {};

  Object.entries(models).forEach(([modelName, genericDataModel]) => {
    const modelFields = mapDataFieldsToCodegen(genericDataModel.fields);

    codegenModels[modelName] = {
      isJoinTable: genericDataModel.isJoinTable,
      primaryKeys: genericDataModel.primaryKeys,
      fields: modelFields,
    };
  });

  Object.entries(nonModels).forEach(([nonModelName, genericDataModel]) => {
    const nonModelFields = mapDataFieldsToCodegen(genericDataModel.fields);

    codegenNonModels[nonModelName] = {
      fields: nonModelFields,
    };
  });

  Object.entries(enums).forEach(([enumName, genericEnum]) => {
    codegenEnums[enumName] = {
      values: genericEnum.values
    }
  })

  return {
    models: codegenModels,
    nonModels: codegenNonModels,
    enums: codegenEnums,
    dataSourceType,
  };
};
