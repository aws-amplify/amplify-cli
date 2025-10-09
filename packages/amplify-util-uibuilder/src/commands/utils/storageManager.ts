import { FieldConfig, Form } from '@aws-sdk/client-amplifyuibuilder';

export const hasStorageField = (form: Form): boolean => {
  const result = form.fields
    ? Object.values(form.fields).some((field) => {
        return isGenericFieldConfig(field) && field.inputType?.type === 'StorageField';
      })
    : false;

  return result;
};

export const isGenericFieldConfig = (config: FieldConfig) => {
  return !Object.keys(config).includes('excluded');
};
