import { StudioForm, StudioFormFieldConfig, StudioGenericFieldConfig, StudioSchema } from '@aws-amplify/codegen-ui';

export const hasStorageField = (form: StudioForm): boolean => {
  const result = Object.values(form.fields).some((field) => {
    return isGenericFieldConfig(field) && field.inputType?.type === 'StorageField';
  });

  return result;
};

export const isFormSchema = (schema: StudioSchema): schema is StudioForm => {
  return schema && Object.keys(schema).includes('fields');
};

export const isGenericFieldConfig = (config: StudioFormFieldConfig): config is StudioGenericFieldConfig => {
  return !Object.keys(config).includes('excluded');
};
