import { JSONUtilities } from 'amplify-cli-core';
import { loadFunctionParameters } from '../../../../provider-utils/awscloudformation/utils/loadFunctionParameters';

jest.mock('amplify-cli-core', () => ({
  JSONUtilities: {
    readJson: jest.fn(),
    writeJson: jest.fn(),
  },
}));

const JSONUtilities_mock = JSONUtilities as jest.Mocked<typeof JSONUtilities>;

describe('load function parameters', () => {
  const permissionsBase = {
    permissions: {
      api: {
        myapiname: ['create', 'read'],
      },
    },
  };
  const funcParamsBase = {
    lambdaLayers: [],
  };

  const mutableParametersStub = {
    mutableParametersState: {
      permissions: {
        api: {
          myapiname: ['create', 'read', 'update'],
        },
        auth: {
          myauth: ['read'],
        },
      },
    },
  };

  it('destructures mutableParametersState if it exists', () => {
    JSONUtilities_mock.readJson.mockImplementationOnce(
      jest.fn(() => ({ ...funcParamsBase, ...permissionsBase, ...mutableParametersStub })),
    );
    expect(loadFunctionParameters('resourcePath')).toEqual({
      ...funcParamsBase,
      ...mutableParametersStub.mutableParametersState,
    });
  });
});
