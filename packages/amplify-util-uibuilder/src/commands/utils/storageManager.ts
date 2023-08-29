import { FieldConfig, Form } from 'aws-sdk/clients/amplifyuibuilder';

export const hasStorageField = (form: Form): boolean => {
  const result = Object.values(form.fields).some((field) => {
    return isGenericFieldConfig(field) && field.inputType?.type === 'StorageField';
  });

  return result;
};

export const isGenericFieldConfig = (config: FieldConfig) => {
  return !Object.keys(config).includes('excluded');
};
