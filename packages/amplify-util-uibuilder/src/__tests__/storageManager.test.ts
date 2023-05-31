import { StudioSchema } from '@aws-amplify/codegen-ui';
import { hasStorageField } from '../commands/utils';

const formWithNoCustomization: StudioSchema = {
  id: 'f-123456',
  name: 'BlogCreateForm',
  formActionType: 'create',
  dataType: {
    dataSourceType: 'DataStore',
    dataTypeName: 'Blog',
  },
  fields: {},
  sectionalElements: {},
  style: {},
  cta: {},
};

const formWithNoStorageField: StudioSchema = {
  ...formWithNoCustomization,
  dataType: { dataSourceType: 'Custom', dataTypeName: 'Blog' },
  fields: {
    name: { inputType: { type: 'TextField' } },
  },
};

const formWithStorageField: StudioSchema = {
  ...formWithNoCustomization,
  dataType: { dataSourceType: 'Custom', dataTypeName: 'Blog' },
  fields: {
    name: { inputType: { type: 'StorageField' } },
  },
};

describe('hasStorageManager', () => {
  it('should return false for form with no StorageManager config', () => {
    expect(hasStorageField(formWithNoStorageField)).toBe(false);
  });

  it('should return true for form with StorageManager config', () => {
    expect(hasStorageField(formWithStorageField)).toBe(true);
  });
});
