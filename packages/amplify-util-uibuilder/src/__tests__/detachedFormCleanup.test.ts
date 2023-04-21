// @aws-amplify/codegen-ui is in project dependencies
import { StudioSchema } from '@aws-amplify/codegen-ui'; // eslint-disable-line import/no-extraneous-dependencies
import { AmplifyStudioClient } from '../clients'; // eslint-disable-line import/no-extraneous-dependencies
import { isFormDetachedFromModel, isFormSchemaCustomized, isStudioForm, deleteDetachedForms } from '../commands/utils';

const amplifyStudioClientMock = AmplifyStudioClient as any;

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

const formWithStyle: StudioSchema = {
  ...formWithNoCustomization,
  dataType: { dataSourceType: 'Custom', dataTypeName: 'Blog' },
  style: {
    horizontalGap: { value: '20px' },
  },
};

const formWithFields: StudioSchema = {
  ...formWithNoCustomization,
  dataType: { dataSourceType: 'Custom', dataTypeName: 'Blog' },
  fields: {
    name: { inputType: { type: 'TextField' } },
  },
};

describe('detachedFormCleanup', () => {
  it('isStudioForm should return true', () => {
    expect(isStudioForm(formWithNoCustomization)).toBe(true);
  });

  it('isStudioForm should return false', () => {
    expect(isStudioForm(undefined)).toBe(false);
  });

  it('isFormSchemaCustomized should return false', () => {
    expect(isFormSchemaCustomized(formWithNoCustomization)).toBe(false);
  });

  it('isFormSchemaCustomized should return true', () => {
    expect(isFormSchemaCustomized(formWithStyle)).toBe(true);
    expect(isFormSchemaCustomized(formWithFields)).toBe(true);
  });

  it('isFormDetachedFromModel should return true for a DataStore form with detached model', () => {
    expect(isFormDetachedFromModel(formWithNoCustomization, new Set<string>())).toBe(true);
  });

  it('isFormDetachedFromModel should return false for a Custom form', () => {
    expect(isFormDetachedFromModel(formWithStyle, new Set<string>())).toBe(false);
  });

  it('isFormDetachedFromModel should return false for a DataStore form with an attached model', () => {
    expect(isFormDetachedFromModel(formWithNoCustomization, new Set<string>().add('Blog'))).toBe(false);
  });

  it('should delete detached forms', async () => {
    const mockedDeleteForm = jest.fn().mockReturnValue(undefined);
    amplifyStudioClientMock.deleteForm = mockedDeleteForm;
    await deleteDetachedForms([{ id: '12345', name: 'BlogCreateForm' }], amplifyStudioClientMock);
    expect(mockedDeleteForm).toBeCalledTimes(1);
    expect(mockedDeleteForm).toHaveBeenCalledWith('12345');
  });
});
