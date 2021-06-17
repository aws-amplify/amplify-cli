import { $TSContext, JSONUtilities, pathManager } from 'amplify-cli-core';
import { LambdaLayer } from 'amplify-function-plugin-interface';
import { saveMutableState } from '../../../../provider-utils/awscloudformation/utils/storeResources';

jest.mock('amplify-cli-core', () => ({
  JSONUtilities: {
    readJson: jest.fn(),
    writeJson: jest.fn(),
  },
  pathManager: {
    getBackendDirPath: jest.fn(),
  },
}));

jest.mock('../../../../provider-utils/awscloudformation/utils/environmentVariablesHelper');

const JSONUtilities_mock = JSONUtilities as jest.Mocked<typeof JSONUtilities>;
const pathManager_mock = pathManager as jest.Mocked<typeof pathManager>;

pathManager_mock.getBackendDirPath.mockImplementation(() => 'backendDir');

describe('save mutable state', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('destructures mutableParametersState in the stored object', async () => {
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

    await saveMutableState({} as $TSContext, input);
    expect(JSONUtilities_mock.writeJson.mock.calls[0][1]).toMatchSnapshot();
  });

  it('removes mutableParametersState from the existing file if present', async () => {
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
    await saveMutableState({} as $TSContext, input);
    expect(JSONUtilities_mock.writeJson.mock.calls[0][1]).toMatchSnapshot();
  });
});
