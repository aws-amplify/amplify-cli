import { stateManager, JSONUtilities, $TSContext, pathManager } from "amplify-cli-core";
import { prompter } from "amplify-prompts";
import {
  ensureEnvironmentVariableValues,
  getStoredEnvironmentVariables,
  saveEnvironmentVariables,
} from "../../../../provider-utils/awscloudformation/utils/environmentVariablesHelper";

jest.mock("amplify-cli-core");
jest.mock("amplify-prompts");

const stateManagerMock = stateManager as jest.Mocked<typeof stateManager>;
const pathManagerMock = pathManager as jest.Mocked<typeof pathManager>;
const JSONUtilitiesMock = JSONUtilities as jest.Mocked<typeof JSONUtilities>;
const prompterMock = prompter as jest.Mocked<typeof prompter>;

pathManagerMock.findProjectRoot.mockReturnValue("");
pathManagerMock.getBackendDirPath.mockReturnValue("");
pathManagerMock.getTeamProviderInfoFilePath.mockReturnValue("");

const envName = "testEnv";

stateManagerMock.getLocalEnvInfo.mockReturnValue({ envName });
stateManagerMock.getTeamProviderInfo.mockReturnValue({
  [envName]: {
    categories: {
      function: {
        testFunc: {
          envVarOne: "testVal1",
        },
      },
    },
  },
});

stateManagerMock.getBackendConfig.mockReturnValue({
  function: {
    testFunc: {},
  },
});

let ensureEnvParamManager;
let getEnvParamManager;

beforeEach(async () => {
  ({ ensureEnvParamManager, getEnvParamManager } = await import("@aws-amplify/amplify-environment-parameters"));
  await ensureEnvParamManager(envName);
  jest.clearAllMocks();
});

describe("getStoredEnvironmentVariables", () => {
  it("does not throw error", () => {
    expect(getStoredEnvironmentVariables("test")).toEqual({});
  });
});

describe("deleteEnvironmentVariable", () => {
  it("does not throw error", () => {
    expect(() => {
      saveEnvironmentVariables("name", { test: "test" });
    }).not.toThrow();
  });
});

describe("ensureEnvironmentVariableValues", () => {
  it("appends to existing env vars", async () => {
    JSONUtilitiesMock.readJson.mockReturnValueOnce({
      environmentVariableList: [
        {
          cloudFormationParameterName: "envVarOne",
          environmentVariableName: "envVarOne",
        },
        {
          cloudFormationParameterName: "envVarTwo",
          environmentVariableName: "envVarTwo",
        },
        {
          cloudFormationParameterName: "envVarThree",
          environmentVariableName: "envVarThree",
        },
      ],
    });

    prompterMock.input.mockResolvedValueOnce("testVal2").mockResolvedValueOnce("testVal3");

    await ensureEnvironmentVariableValues({ usageData: { emitError: jest.fn() } } as $TSContext);
    expect(getEnvParamManager().getResourceParamManager("function", "testFunc").getAllParams()).toEqual({
      envVarOne: "testVal1",
      envVarTwo: "testVal2",
      envVarThree: "testVal3",
    });
  });
});
