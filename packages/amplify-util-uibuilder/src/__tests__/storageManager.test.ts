import { hasStorageField } from '../commands/utils';
import { Form } from 'aws-sdk/clients/amplifyuibuilder';

const formWithNoCustomization: Form = {
  appId: 'appId123',
  environmentName: 'staging',
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
  schemaVersion: '1.0'
};

const formWithNoStorageField: Form = {
  ...formWithNoCustomization,
  dataType: { dataSourceType: 'Custom', dataTypeName: 'Blog' },
  fields: {
    name: { inputType: { type: 'TextField' } },
  },
};

const formWithStorageField: Form = {
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
