import { StudioForm, StudioFormFieldConfig, StudioGenericFieldConfig, StudioSchema } from '@aws-amplify/codegen-ui';
import { FieldConfig, Form } from 'aws-sdk/clients/amplifyuibuilder';

export const hasStorageField = (form: Form): boolean => {
  const result = Object.values(form.fields).some((field) => {
    return isGenericFieldConfig(field) && field.inputType?.type === 'StorageField';
  });

  return result;
};

export const isFormSchema = (schema: StudioSchema): schema is StudioForm => {
  return schema && Object.keys(schema).includes('fields');
};

export const isGenericFieldConfig = (config: FieldConfig) => {
  return !Object.keys(config).includes('excluded');
};
