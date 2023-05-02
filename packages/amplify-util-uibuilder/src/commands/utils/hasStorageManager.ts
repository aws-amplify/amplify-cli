import { StudioForm } from '@aws-amplify/codegen-ui';

export const hasStorageManager = (form: StudioForm): boolean => {
  const result = Object.values(form.fields).some((field) => {
    return 'inputType' in field && field.inputType?.type === 'StorageField';
  });

  return result;
};
