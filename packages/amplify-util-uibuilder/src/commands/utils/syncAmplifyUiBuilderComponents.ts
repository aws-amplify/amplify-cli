import { printer } from '@aws-amplify/amplify-prompts';
import type { GenericDataSchema, GenericDataField, GenericDataRelationshipType } from '@aws-amplify/codegen-ui';
import {
  CodegenGenericDataEnum,
  CodegenGenericDataFieldDataType,
  CodegenGenericDataField,
  CodegenGenericDataModel,
  CodegenGenericDataNonModel,
  CodegenGenericDataRelationshipType,
  CodegenJob,
  CodegenJobGenericDataSchema,
} from '@aws-sdk/client-amplifyuibuilder';
import fetch from 'node-fetch';
import { performance } from 'perf_hooks';
import path from 'path';
import fs from 'fs';
import asyncPool from 'tiny-async-pool';

const mapRelationshipTypeToCodegen = (
  relationship: GenericDataRelationshipType | undefined,
): CodegenGenericDataRelationshipType | undefined => {
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

const mapDataFieldsToCodegen = (fields: { [fieldName: string]: GenericDataField }): Record<string, CodegenGenericDataField> => {
  const codegenFields: Record<string, CodegenGenericDataField> = {};

  Object.entries(fields).forEach(([fieldName, dataField]) => {
    let dataType: CodegenGenericDataFieldDataType = 'String';
    let dataTypeValue = '';
    if (typeof dataField.dataType === 'object' && dataField.dataType !== null) {
      if ('enum' in dataField.dataType) {
        dataType = 'Enum';
        dataTypeValue = dataField.dataType.enum;
      } else if ('model' in dataField.dataType) {
        dataType = 'Model';
        dataTypeValue = dataField.dataType.model;
      } else if ('nonModel' in dataField.dataType) {
        dataType = 'NonModel';
        dataTypeValue = dataField.dataType.nonModel;
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
      codegenFields[fieldName].relationship = mapRelationshipTypeToCodegen(dataField.relationship);
    }
  });

  return codegenFields;
};

export const mapGenericDataSchemaToCodegen = (genericDataSchema: GenericDataSchema): CodegenJobGenericDataSchema => {
  const { models, nonModels, enums, dataSourceType } = genericDataSchema;
  const codegenModels: { [key: string]: CodegenGenericDataModel } = {};
  const codegenNonModels: { [key: string]: CodegenGenericDataNonModel } = {};
  const codegenEnums: { [key: string]: CodegenGenericDataEnum } = {};

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
      values: genericEnum.values,
    };
  });

  return {
    models: codegenModels,
    nonModels: codegenNonModels,
    enums: codegenEnums,
    dataSourceType,
  };
};

function delay(durationMs: number): Promise<void> {
  return new Promise((r) => setTimeout(() => r(), durationMs));
}

export const waitForSucceededJob = async (getJob: () => Promise<CodegenJob>, { pollInterval }: { pollInterval: number }) => {
  const startTime = performance.now();
  // Adding env variable because if something happens and we need a longer timeout
  // we will give the customer a chance to increase timeout as a workaround.
  // Default timeout is 2 minutes for customers with thousands of components.
  const waitTimeout = process.env.UI_BUILDER_CODEGENJOB_TIMEOUT ? parseInt(process.env.UI_BUILDER_CODEGENJOB_TIMEOUT) : 1000 * 60 * 2;

  const endTime = startTime + waitTimeout;

  while (performance.now() < endTime) {
    const job = await getJob();

    if (!job) {
      printer.error('Codegen job not found');
      throw new Error('Codegen job not found');
    }

    if (job.status === 'failed') {
      printer.error('Codegen job status is failed', { message: job.statusMessage });
      throw new Error(job.statusMessage);
    }

    if (job.status === 'succeeded') {
      printer.debug(`Polling time: ${performance.now() - startTime}`);

      return job;
    }

    await delay(pollInterval);
  }

  if (performance.now() > endTime) {
    printer.error(`Codegen job never succeeded before timeout`);
  }

  throw new Error('Failed to return codegen job');
};

export const fetchWithRetries = async (url: string, retries = 3, delay = 300) => {
  let retryCount = 0;
  let retryDelay = delay;

  while (retryCount < retries) {
    try {
      const response = await fetch(url);
      return response;
    } catch (error) {
      printer.debug(`Error fetching ${url}: ${error}`);
      retryCount = retryCount + 1;
      await new Promise((res) => setTimeout(res, delay));
      retryDelay = retryDelay * 2;
    }
  }
  throw new Error('Fetch reached max number of retries without succeeding');
};

export const extractUIComponents = async (url: string, uiBuilderComponentsPath: string) => {
  try {
    if (!fs.existsSync(uiBuilderComponentsPath)) {
      fs.mkdirSync(uiBuilderComponentsPath, { recursive: true });
    }

    const response = await fetchWithRetries(url);
    if (!response.ok) {
      throw new Error('Failed to download component manifest file');
    }
    const manifestFile = await (<
      Promise<{ Output: { downloadUrl: string | undefined; fileName: string; schemaName: string; error: string | undefined }[] }>
    >response.json());

    const downloadComponent = async (output: { fileName: string; downloadUrl: string | undefined; error: string | undefined }) => {
      if (output.downloadUrl && !output.error) {
        try {
          const response = await fetchWithRetries(output.downloadUrl);
          if (!response.ok) {
            printer.debug(`Failed to download ${output.fileName}`);
            throw new Error(`Failed to download ${output.fileName}`);
          }
          return { content: await response.text(), error: undefined, fileName: output.fileName };
        } catch (error) {
          printer.debug(`Skipping ${output.fileName} because of an error downloading the component`);
          return { error: `Failed to download ${output.fileName}`, content: undefined, fileName: output.fileName };
        }
      } else {
        printer.debug(`Skipping ${output.fileName} because of an error generating the component`);
        return { error: output.error, content: undefined, fileName: output.fileName };
      }
    };

    for await (const downloaded of asyncPool(5, manifestFile.Output, downloadComponent)) {
      if (downloaded.content) {
        fs.writeFileSync(path.join(uiBuilderComponentsPath, downloaded.fileName), downloaded.content);
        printer.debug(`Downloaded ${downloaded.fileName}`);
      }
    }
    printer.debug('ui-components downloaded successfully');
  } catch (error) {
    printer.error('failed to download ui-components');
    throw error;
  }
};
