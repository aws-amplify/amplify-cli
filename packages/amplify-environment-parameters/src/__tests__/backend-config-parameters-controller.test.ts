import { stateManager, AmplifyError } from '@aws-amplify/amplify-cli-core';
import { IBackendParametersController } from '../backend-config-parameters-controller';

jest.mock('@aws-amplify/amplify-cli-core');
const stateManagerMock = stateManager as jest.Mocked<typeof stateManager>;
const AmplifyErrorMock = AmplifyError as jest.MockedClass<typeof AmplifyError>;

const testParams = {
  testParam: {
    usedBy: [
      {
        category: 'function',
        resourceName: 'other',
      },
    ],
  },
};

stateManagerMock.backendConfigFileExists.mockReturnValue(true);
stateManagerMock.getBackendConfig.mockReturnValue({
  someCategory: {
    other: 'stuff',
  },
  parameters: testParams,
});

describe('BackendConfigParameterMapController', () => {
  let backendParamsController: IBackendParametersController;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.isolateModules(() => {
      // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
      const { getParametersControllerInstance } = require('../backend-config-parameters-controller');
      backendParamsController = getParametersControllerInstance();
    });
    backendParamsController.removeAllParameters();
    backendParamsController.addAllParameters(testParams);
  });

  it('returns initial parameters', () => {
    const actualParams = backendParamsController.getParameters();
    expect(actualParams).toEqual(testParams);
  });

  describe('addParameter', () => {
    it('adds single parameter', () => {
      backendParamsController.addParameter('anotherParam', [{ category: 'something', resourceName: 'else' }]);
      expect(backendParamsController.getParameters()).toMatchInlineSnapshot(`
{
  "anotherParam": {
    "usedBy": [
      {
        "category": "something",
        "resourceName": "else",
      },
    ],
  },
  "testParam": {
    "usedBy": [
      {
        "category": "function",
        "resourceName": "other",
      },
    ],
  },
}
`);
    });
  });

  describe('addAllParameters', () => {
    it('adds all parameters', () => {
      backendParamsController.addAllParameters({
        anotherParam: {
          usedBy: [
            {
              category: 'something',
              resourceName: 'else',
            },
          ],
        },
        lastParam: {
          usedBy: [
            {
              category: 'aCategory',
              resourceName: 'aResource',
            },
          ],
        },
      });
      expect(backendParamsController.getParameters()).toMatchInlineSnapshot(`
{
  "anotherParam": {
    "usedBy": [
      {
        "category": "something",
        "resourceName": "else",
      },
    ],
  },
  "lastParam": {
    "usedBy": [
      {
        "category": "aCategory",
        "resourceName": "aResource",
      },
    ],
  },
  "testParam": {
    "usedBy": [
      {
        "category": "function",
        "resourceName": "other",
      },
    ],
  },
}
`);
    });
  });

  describe('removeParameter', () => {
    it('removes single parameter', () => {
      backendParamsController.removeParameter('testParam');
      expect(backendParamsController.getParameters()).toEqual({});
    });
  });

  describe('removeAllParameters', () => {
    it('removes all parameters', () => {
      backendParamsController.removeAllParameters();
      expect(backendParamsController.getParameters()).toEqual({});
    });
  });

  describe('save', () => {
    it('writes current parameter state to backend config', async () => {
      await backendParamsController.save();
      expect(stateManagerMock.setBackendConfig.mock.calls[0][1]).toMatchInlineSnapshot(`
{
  "parameters": {
    "testParam": {
      "usedBy": [
        {
          "category": "function",
          "resourceName": "other",
        },
      ],
    },
  },
  "someCategory": {
    "other": "stuff",
  },
}
`);
    });
  });
});

describe('getParametersControllerInstance', () => {
  it('throws on invalid backend config', () => {
    stateManagerMock.getBackendConfig.mockReturnValue({
      parameters: 'this is not right',
    });
    const { getParametersControllerInstance } = jest.requireActual('../backend-config-parameters-controller');
    expect(() => getParametersControllerInstance()).toThrow();
    expect(AmplifyErrorMock.mock.calls[0]).toMatchInlineSnapshot(`
[
  "BackendConfigValidationError",
  {
    "details": "{
  "keyword": "type",
  "dataPath": "",
  "schemaPath": "#/type",
  "params": {
    "type": "object"
  },
  "message": "should be object"
}",
    "message": "backend-config.json parameter config is invalid",
    "resolution": "Correct the errors in the file and retry the command",
  },
]
`);
  });
});
