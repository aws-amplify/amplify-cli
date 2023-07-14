import { hasStorageField } from '../commands/utils';
import { Form } from 'aws-sdk/clients/amplifyuibuilder';

const formWithNoCustomization: Form = {
  id: 'f-123456',
  appId: '123',
  environmentName: 'staging',
  schemaVersion: '1.0',
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
