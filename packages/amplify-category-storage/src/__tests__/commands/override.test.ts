import { $TSContext, $TSObject, stateManager, generateOverrideSkeleton, pathManager } from 'amplify-cli-core';
import { run } from '../../commands/storage/override';
import { printer, prompter } from 'amplify-prompts';
import path from 'path';
import { DynamoDBInputState } from '../../provider-utils/awscloudformation/service-walkthroughs/dynamoDB-input-state';

jest.mock('amplify-cli-core');
jest.mock('amplify-prompts');
jest.mock('path');
jest.mock('../../provider-utils/awscloudformation/service-walkthroughs/dynamoDB-input-state');
jest.mock('../../provider-utils/awscloudformation/cdk-stack-builder/ddb-stack-transform');

const generateOverrideSkeleton_mock = generateOverrideSkeleton as jest.MockedFunction<typeof generateOverrideSkeleton>;
generateOverrideSkeleton_mock.mockImplementation = jest.fn().mockImplementation(async () => {
  return 'mockResourceName';
});

describe('override ddb command tests', () => {
  let mockContext: $TSContext;
  let mockAmplifyMeta: $TSObject = {};

  beforeEach(() => {
    jest.clearAllMocks();
    mockContext = {
      amplify: {},
    } as unknown as $TSContext;
  });

  it('override ddb when two ddb storage resources present', async () => {
    mockAmplifyMeta = {
      storage: {
        dynamo73399689: {
          service: 'DynamoDB',
          providerPlugin: 'awscloudformation',
        },
        dynamoefb50875: {
          service: 'DynamoDB',
          providerPlugin: 'awscloudformation',
        },
      },
    };

    const destDir = 'mockDir';
    const srcDir = 'mockSrcDir';

    stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);
    pathManager.getResourceDirectoryPath = jest.fn().mockReturnValue(destDir);
    path.join = jest.fn().mockReturnValue(srcDir);

    prompter.pick = jest.fn().mockReturnValue('dynamo73399689');
    jest.spyOn(DynamoDBInputState.prototype, 'cliInputFileExists').mockImplementation(() => true);

    await run(mockContext);

    expect(prompter.pick).toBeCalledTimes(1);
    expect(generateOverrideSkeleton).toHaveBeenCalledWith(mockContext, srcDir, destDir);
  });

  it('override ddb when one ddb storage resource present', async () => {
    mockAmplifyMeta = {
      storage: {
        dynamo73399689: {
          service: 'DynamoDB',
          providerPlugin: 'awscloudformation',
        },
      },
    };

    const destDir = 'mockDir';
    const srcDir = 'mockSrcDir';

    stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);
    pathManager.getResourceDirectoryPath = jest.fn().mockReturnValue(destDir);
    path.join = jest.fn().mockReturnValue(srcDir);

    jest.spyOn(DynamoDBInputState.prototype, 'cliInputFileExists').mockImplementation(() => true);

    await run(mockContext);

    // Prompter should not be called when only one ddb/storage resource present
    expect(prompter.pick).toBeCalledTimes(0);
    expect(generateOverrideSkeleton).toHaveBeenCalledWith(mockContext, srcDir, destDir);
  });

  it('override ddb when no ddb storage resource present', async () => {
    mockAmplifyMeta = {};
    stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);

    await run(mockContext);
    expect(printer.error).toHaveBeenCalledWith('No resources to override. You need to add a resource.');
  });
});
