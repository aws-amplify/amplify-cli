import { loadFunctionParameters } from '../../../../provider-utils/awscloudformation/utils/loadFunctionParameters';

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
  const context_stub = {
    amplify: {
      readJsonFile: jest.fn(() => ({ ...funcParamsBase, ...permissionsBase, ...mutableParametersStub })),
    },
  };
  it('destructures mutableParametersState if it exists', () => {
    expect(loadFunctionParameters(context_stub, 'resourcePath')).toEqual({
      ...funcParamsBase,
      ...mutableParametersStub.mutableParametersState,
    });
  });
});
