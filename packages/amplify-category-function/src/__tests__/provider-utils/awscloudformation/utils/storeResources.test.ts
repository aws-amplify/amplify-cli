import { JSONUtilities } from 'amplify-cli-core';
import { LambdaLayer } from 'amplify-function-plugin-interface';
import { saveMutableState } from '../../../../provider-utils/awscloudformation/utils/storeResources';

// jest.mock('../../../../../../amplify-cli-core/src/jsonUtilities');
jest.mock('amplify-cli-core', () => {
  return jest.fn().mockImplementation(() => {
    return {
      JSONUtilities: {
        readJson: jest.fn(),
        writeJson: jest.fn(),
      },
    };
  });
});

describe('save mutable state', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const context_stub = {
    amplify: {
      pathManager: {
        getBackendDirPath: () => 'backendDir',
      },
    },
  };

  it('destructures mutableParametersState in the stored object', () => {
    const mutableParametersStateContents = {
      permissions: {
        something: 'a value',
      },
    };
    const input = {
      mutableParametersState: mutableParametersStateContents,
      resourceName: 'testResourceName',
      lambdaLayers: [] as LambdaLayer[],
    };

    saveMutableState(context_stub, input);
    expect(JSONUtilities.writeJson.mock.calls[0][1]).toMatchSnapshot();
  });

  it('removes mutableParametersState from the existing file if present', () => {
    JSONUtilities.readJson.mockImplementationOnce(() => ({
      lambdaLayers: [],
      permissions: {
        something: 'a value',
      },
      mutableParametersState: {
        permissions: {
          something: 'a new value',
        },
      },
    }));
    const input = {
      mutableParametersState: {
        permissions: {
          something: 'the latest value',
          somethingElse: 'other value',
        },
      },
      lambdaLayers: [],
      resourceName: 'testResourceName',
    };
    saveMutableState(context_stub, input);
    expect(JSONUtilities.mock.calls[0][1]).toMatchSnapshot();
  });
});
