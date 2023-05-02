import { StudioForm, StudioSchema } from '@aws-amplify/codegen-ui';

export const hasStorageField = (form: StudioForm): boolean => {
  const result = Object.values(form.fields).some((field) => {
    return 'inputType' in field && field.inputType?.type === 'StorageField';
  });

  return result;
};

export function isFormSchema(schema: StudioSchema): schema is StudioForm {
  return (
    schema &&
    Object.keys(schema).find(function (key) {
      return key === 'fields';
    }) !== undefined
  );
}
