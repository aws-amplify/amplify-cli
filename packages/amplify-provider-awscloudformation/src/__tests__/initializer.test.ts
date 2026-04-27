import { $TSContext, JSONUtilities, stateManager } from '@aws-amplify/amplify-cli-core';
import { run } from '../initializer';
import { prePushCfnTemplateModifier } from '../pre-push-cfn-processor/pre-push-cfn-modifier';
import CloudFormation from '../aws-utils/aws-cfn';
import * as amplifyServiceManager from '../amplify-service-manager';
import { getConfiguredAmplifyClient } from '../aws-utils/aws-amplify';
import * as gen1NewCustomerRestriction from '../gen1-new-customer-restriction';

jest.mock('../pre-push-cfn-processor/pre-push-cfn-modifier');
jest.mock('../configuration-manager');
jest.mock('../aws-utils/aws-cfn');
jest.mock('fs-extra');
jest.mock('../amplify-service-manager');
jest.mock('@aws-amplify/amplify-cli-core');
jest.mock('../permissions-boundary/permissions-boundary');
jest.mock('../aws-utils/aws-amplify');
jest.mock('../gen1-new-customer-restriction');

const CloudFormationMock = CloudFormation as jest.MockedClass<typeof CloudFormation>;
const amplifyServiceManagerMock = amplifyServiceManager as jest.Mocked<typeof amplifyServiceManager>;
const JSONUtilitiesMock = JSONUtilities as jest.Mocked<typeof JSONUtilities>;
const stateManagerMock = stateManager as jest.Mocked<typeof stateManager>;
const getConfiguredAmplifyClientMock = getConfiguredAmplifyClient as jest.MockedFunction<typeof getConfiguredAmplifyClient>;
const enforceGen1NewCustomerRestrictionMock = gen1NewCustomerRestriction.enforceGen1NewCustomerRestriction as jest.MockedFunction<
  typeof gen1NewCustomerRestriction.enforceGen1NewCustomerRestriction
>;

describe('run', () => {
  it('transforms the root stack using the pre-push modifier', async () => {
    // setup
    const contextStub = {
      pluginPlatform: {
        plugins: {
          core: [{ packageVersion: '5.2' }],
        },
      },
      exeInfo: {
        isNewEnv: true,
        projectConfig: {
          projectName: 'test',
        },
        localEnvInfo: {
          envName: 'testenv', // eslint-disable-line spellcheck/spell-checker
        },
        teamProviderInfo: {},
      },
      amplify: {
        getTags: jest.fn(),
      },
      input: {},
    } as unknown as $TSContext;
    CloudFormationMock.mockImplementation(
      () =>
        ({
          createResourceStack: jest.fn().mockResolvedValue({
            Stacks: [
              {
                Outputs: [],
              },
            ],
          }),
        } as unknown as CloudFormation),
    );
    amplifyServiceManagerMock.init.mockResolvedValueOnce({} as any);
    JSONUtilitiesMock.readJson.mockReturnValueOnce({});
    stateManagerMock.getLocalEnvInfo.mockReturnValueOnce({});

    // execute
    await run(contextStub);

    // verify
    expect(prePushCfnTemplateModifier).toBeCalled();
  });
});

describe('Gen 1 new-customer restriction in initializer', () => {
  const baseContextStub = {
    pluginPlatform: { plugins: { core: [{ packageVersion: '5.2' }] } },
    exeInfo: {
      isNewEnv: true,
      projectConfig: { projectName: 'test' },
      localEnvInfo: { envName: 'testenv' },
      teamProviderInfo: {},
    },
    amplify: { getTags: jest.fn().mockReturnValue([]) },
    input: {},
  } as unknown as $TSContext;

  beforeEach(() => {
    jest.clearAllMocks();
    CloudFormationMock.mockImplementation(
      () =>
        ({
          createResourceStack: jest.fn().mockResolvedValue({ Stacks: [{ Outputs: [] }] }),
        } as unknown as CloudFormation),
    );
    amplifyServiceManagerMock.init.mockResolvedValue({} as any);
    JSONUtilitiesMock.readJson.mockReturnValue({});
    stateManagerMock.getLocalEnvInfo.mockReturnValue({});
    getConfiguredAmplifyClientMock.mockResolvedValue({} as any);
    enforceGen1NewCustomerRestrictionMock.mockResolvedValue(undefined);
  });

  it('blocks new app creation when account is not an existing Gen 1 customer', async () => {
    const restrictionError = new Error(
      'AWS Amplify Gen 1 has entered maintenance mode and will no longer accept new customers. Gen 1 will reach end of life on May 1, 2027. Start a new app with Amplify Gen 2: https://docs.amplify.aws/',
    );
    (restrictionError as any).name = 'ProjectInitError';
    enforceGen1NewCustomerRestrictionMock.mockRejectedValueOnce(restrictionError);

    await expect(run(baseContextStub)).rejects.toThrow('AWS Amplify Gen 1 has entered maintenance mode');
    expect(amplifyServiceManagerMock.init).not.toHaveBeenCalled();
  });

  it('allows existing Gen 1 customer to proceed', async () => {
    enforceGen1NewCustomerRestrictionMock.mockResolvedValue(undefined);

    await run(baseContextStub);

    expect(enforceGen1NewCustomerRestrictionMock).toHaveBeenCalled();
    expect(amplifyServiceManagerMock.init).toHaveBeenCalled();
  });

  it('skips restriction check when --appId is provided', async () => {
    const contextWithAppId = {
      ...baseContextStub,
      exeInfo: {
        ...baseContextStub.exeInfo,
        inputParams: { amplify: { appId: 'existing-app-id' } },
      },
    } as unknown as $TSContext;

    await run(contextWithAppId);

    expect(enforceGen1NewCustomerRestrictionMock).not.toHaveBeenCalled();
  });
});
