// // @aws-amplify/codegen-ui is in project dependencies
import { StudioSchema } from '@aws-amplify/codegen-ui'; // eslint-disable-line import/no-extraneous-dependencies
import {
  isFormDetachedFromModel, isFormSchemaCustomized, isStudioForm, shouldDeleteForm,
} from '../commands/utils';

const formWithNoCustomizations: StudioSchema = {
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

const formWithStyle: StudioSchema = {
  ...formWithNoCustomizations,
  dataType: { dataSourceType: 'Custom', dataTypeName: 'Blog' },
  style: {
    horizontalGap: { value: '20px' },
  },
};

const formWithFields: StudioSchema = {
  ...formWithNoCustomizations,
  dataType: { dataSourceType: 'Custom', dataTypeName: 'Blog' },
  fields: {
    name: { inputType: { type: 'TextField' } },
  },
};

describe('detachedFormCleanup', () => {
  it('isStudioForm should return true', () => {
    expect(isStudioForm(formWithNoCustomizations)).toBe(true);
  });

  it('isStudioForm should return false', () => {
    expect(isStudioForm(undefined)).toBe(false);
  });

  it('isFormSchemaCustomized should return false', () => {
    expect(isFormSchemaCustomized(formWithNoCustomizations)).toBe(false);
  });

  it('isFormSchemaCustomized should return true', () => {
    expect(isFormSchemaCustomized(formWithStyle)).toBe(true);
    expect(isFormSchemaCustomized(formWithFields)).toBe(true);
  });

  it('isFormDetachedFromModel should return true for a DataStore form with detached model', () => {
    expect(isFormDetachedFromModel(formWithNoCustomizations, {})).toBe(true);
  });

  it('isFormDetachedFromModel should return false for a Custom form', () => {
    expect(isFormDetachedFromModel(formWithStyle, {})).toBe(false);
  });

  it('isFormDetachedFromModel should return false for a DataStore form with an attached model', () => {
    expect(isFormDetachedFromModel(formWithNoCustomizations, { Blog: { fields: {} } })).toBe(false);
  });

  it('shouldDeleteForm should return false', () => {
    expect(shouldDeleteForm(formWithNoCustomizations, { Blog: { fields: {} } })).toBe(false);
    expect(shouldDeleteForm(formWithStyle, {})).toBe(false);
  });

  it('shouldDeleteForm should return true', () => {
    expect(shouldDeleteForm(formWithNoCustomizations, { House: { fields: {} } })).toBe(true);
  });
});
