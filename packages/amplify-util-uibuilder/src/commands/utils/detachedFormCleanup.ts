import { Form } from '@aws-sdk/client-amplifyuibuilder';
import { AmplifyStudioClient } from '../../clients';
import { printer } from '@aws-amplify/amplify-prompts';
import asyncPool from 'tiny-async-pool';

/**
 * Does the form's reference DataStore type exist in the list of models
 */
export const isFormDetachedFromModel = (formSchema: Form, modelNames: Set<string>): boolean => {
  return (
    formSchema.dataType?.dataSourceType === 'DataStore' &&
    !!formSchema.dataType?.dataTypeName &&
    !modelNames.has(formSchema.dataType.dataTypeName)
  );
};

/**
 * A form schema will be customized if fields, style, sectionalElements objects aren't empty
 * @param schema The schema to test
 * @returns boolean
 */
export const isFormSchemaCustomized = (formSchema: Form): boolean => {
  const { fields, style, sectionalElements } = formSchema;
  // Fields and sectionalElements just need an empty check
  if (!isEmpty({ ...fields, ...sectionalElements })) {
    return true;
  }

  // Check style
  // If not empty, at least one style must be defined
  return style ? Object.values(style).some((styleConfig) => styleConfig !== undefined) : false;
};

/**
 * Is the schema a StudioForm
 */
export const isStudioForm = (schema: Form | undefined): schema is Form => {
  if (!schema) return false;
  return 'formActionType' in schema;
};

export const deleteDetachedForms = async (detachedForms: { id: string; name: string }[], studioClient: AmplifyStudioClient) => {
  const deleteForm = async ({ id, name }: { id: string; name: string }) => {
    try {
      // Try to delete the form but don't stop any other operations if it fails
      await studioClient.deleteForm(id);
      return { status: 'SUCCESS', message: `Deleted detached form ${name}` };
    } catch (error) {
      return { status: 'FAIL', message: `Failed to delete detached form ${name}` };
    }
  };
  for await (const status of asyncPool(5, detachedForms, deleteForm)) {
    printer.debug(status.message);
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isEmpty = (obj?: any): boolean => Object.keys(obj).length === 0;
