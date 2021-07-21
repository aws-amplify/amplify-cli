import { run } from '../initializer';
import { prePushCfnTemplateModifier } from '../pre-push-cfn-processor/pre-push-cfn-modifier';
import CloudFormation from '../aws-utils/aws-cfn';
import * as amplifyServiceManager from '../amplify-service-manager';
import { JSONUtilities, stateManager } from 'amplify-cli-core';

jest.mock('../pre-push-cfn-processor/pre-push-cfn-modifier');
jest.mock('../configuration-manager');
jest.mock('../aws-utils/aws-cfn');
jest.mock('fs-extra');
jest.mock('../amplify-service-manager');
jest.mock('amplify-cli-core');
jest.mock('../permissions-boundary/permissions-boundary');

const CloudFormation_mock = CloudFormation as jest.MockedClass<typeof CloudFormation>;
const amplifyServiceManager_mock = amplifyServiceManager as jest.Mocked<typeof amplifyServiceManager>;
const JSONUtilities_mock = JSONUtilities as jest.Mocked<typeof JSONUtilities>;
const stateManager_mock = stateManager as jest.Mocked<typeof stateManager>;

describe('run', () => {
  it('transforms the root stack using the pre-push modifier', async () => {
    // setup
    const context_stub = {
      exeInfo: {
        isNewEnv: true,
        projectConfig: {
          projectName: 'test',
        },
        localEnvInfo: {
          envName: 'testenv',
        },
        teamProviderInfo: {},
      },
      amplify: {
        getTags: jest.fn(),
      },
    };
    CloudFormation_mock.mockImplementation(
      () =>
        (({
          createResourceStack: jest.fn().mockResolvedValue({
            Stacks: [
              {
                Outputs: [],
              },
            ],
          }),
        } as unknown) as CloudFormation),
    );
    amplifyServiceManager_mock.init.mockResolvedValueOnce({} as any);
    JSONUtilities_mock.readJson.mockReturnValueOnce({});
    stateManager_mock.getLocalEnvInfo.mockReturnValueOnce({});

    // execute
    await run(context_stub);

    // verify
    expect(prePushCfnTemplateModifier).toBeCalled();
  });
});
