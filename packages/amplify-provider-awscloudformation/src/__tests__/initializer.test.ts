import { $TSContext, JSONUtilities, stateManager } from '@aws-amplify/amplify-cli-core';
import { run } from '../initializer';
import { prePushCfnTemplateModifier } from '../pre-push-cfn-processor/pre-push-cfn-modifier';
import CloudFormation from '../aws-utils/aws-cfn';
import * as amplifyServiceManager from '../amplify-service-manager';

jest.mock('../pre-push-cfn-processor/pre-push-cfn-modifier');
jest.mock('../configuration-manager');
jest.mock('../aws-utils/aws-cfn');
jest.mock('fs-extra');
jest.mock('../amplify-service-manager');
jest.mock('@aws-amplify/amplify-cli-core');
jest.mock('../permissions-boundary/permissions-boundary');

const CloudFormationMock = CloudFormation as jest.MockedClass<typeof CloudFormation>;
const amplifyServiceManagerMock = amplifyServiceManager as jest.Mocked<typeof amplifyServiceManager>;
const JSONUtilitiesMock = JSONUtilities as jest.Mocked<typeof JSONUtilities>;
const stateManagerMock = stateManager as jest.Mocked<typeof stateManager>;

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
