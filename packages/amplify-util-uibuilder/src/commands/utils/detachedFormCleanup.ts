import { GenericDataModel, StudioForm, StudioSchema } from '@aws-amplify/codegen-ui';

/**
 * Determines if an attempt to delete should be made
 */
export const shouldDeleteForm = (schema: StudioForm, models: {
  [modelName: string]: GenericDataModel;
}): boolean => {
  if (
    isFormDetachedFromModel(schema, models)
    && isFormSchemaCustomized(schema) === false
  ) {
    return true;
  }
  return false;
};

/**
 * Does the form's reference DataStore type exist in the list of models
 */
export const isFormDetachedFromModel = (schema: StudioForm, models: {
  [modelName: string]: GenericDataModel;
}): boolean => {
  if (schema.dataType.dataSourceType === 'DataStore') {
    const model = models[schema.dataType.dataTypeName];
    if (!model) return true;
  }
  return false;
};

/**
 * A form schema will be customized if fields, style, sectionalElements objects aren't empty
 * @param schema The schema to test
 * @returns boolean
 */
export const isFormSchemaCustomized = (schema: StudioForm): boolean => {
  const { fields, style, sectionalElements } = schema;
  // Check fields and sectionalElements just need an empty check
  if (!isEmpty({ ...fields, ...sectionalElements })) {
    return true;
  }

  // Check style
  if (!isEmpty(style)) {
    // Can be empty but each style can be undefined
    for (const styleConfig of Object.values(style)) {
      if (styleConfig !== undefined) return true;
    }
  }

  return false;
};

/**
 * Is the schema a StudioForm
 */
export const isStudioForm = (schema: StudioSchema | undefined): schema is StudioForm => {
  if (!schema) return false;
  return 'formActionType' in schema;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isEmpty = (obj?: any): boolean => Object.keys(obj).length === 0;
