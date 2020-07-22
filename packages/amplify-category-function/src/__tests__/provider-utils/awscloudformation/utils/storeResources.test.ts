import { LambdaLayer } from 'amplify-function-plugin-interface';
import { saveMutableState } from '../../../../provider-utils/awscloudformation/utils/storeResources';

describe('save mutable state', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const context_stub = {
    amplify: {
      pathManager: {
        getBackendDirPath: () => 'backendDir',
      },
      writeObjectAsJson: jest.fn(),
      readJsonFile: jest.fn(() => ({})),
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
    expect(context_stub.amplify.writeObjectAsJson.mock.calls[0][1]).toMatchSnapshot();
  });

  it('removes mutableParametersState from the existing file if present', () => {
    context_stub.amplify.readJsonFile.mockImplementationOnce(() => ({
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
    expect(context_stub.amplify.writeObjectAsJson.mock.calls[0][1]).toMatchSnapshot();
  });
});
