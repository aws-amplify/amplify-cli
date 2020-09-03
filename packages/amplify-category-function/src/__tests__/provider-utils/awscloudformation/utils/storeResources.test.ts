import { JSONUtilities } from 'amplify-cli-core';
import { LambdaLayer } from 'amplify-function-plugin-interface';
import { saveMutableState } from '../../../../provider-utils/awscloudformation/utils/storeResources';

jest.mock('amplify-cli-core', () => ({
  JSONUtilities: {
    readJson: jest.fn(),
    writeJson: jest.fn(),
  },
}));

const JSONUtilities_mock = JSONUtilities as jest.Mocked<typeof JSONUtilities>;

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
    expect(JSONUtilities_mock.writeJson.mock.calls[0][1]).toMatchSnapshot();
  });

  it('removes mutableParametersState from the existing file if present', () => {
    JSONUtilities_mock.readJson.mockImplementationOnce(() => ({
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
    expect(JSONUtilities_mock.writeJson.mock.calls[0][1]).toMatchSnapshot();
  });
});
