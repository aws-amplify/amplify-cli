import { $TSContext, pathManager, stateManager } from '@aws-amplify/amplify-cli-core';
import { prompter } from '@aws-amplify/amplify-prompts';
import { run } from '../../commands/custom/update';
import { CDK_SERVICE_NAME, CFN_SERVICE_NAME } from '../../utils/constants';
import { updateCloudFormationWalkthrough } from '../../walkthroughs/cloudformation-walkthrough';

jest.mock('../../walkthroughs/cloudformation-walkthrough');
jest.mock('@aws-amplify/amplify-cli-core');
jest.mock('@aws-amplify/amplify-prompts');

const mockAmplifyMeta = {
  custom: {
    mockcdkresourcename: {
      service: CDK_SERVICE_NAME,
      providerPlugin: 'awscloudformation',
    },
    mockcfnresourcename: {
      service: CFN_SERVICE_NAME,
      providerPlugin: 'awscloudformation',
    },
  },
};

stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);
pathManager.getBackendDirPath = jest.fn().mockReturnValue('mockTargetDir');

const updateCloudFormationWalkthrough_mock = updateCloudFormationWalkthrough as jest.MockedFunction<typeof updateCloudFormationWalkthrough>;

describe('update custom flow', () => {
  let mockContext: $TSContext;

  beforeEach(() => {
    jest.clearAllMocks();
    mockContext = {
      amplify: {
        openEditor: jest.fn(),
      },
    } as unknown as $TSContext;
  });

  it('update custom workflow is invoked for a CFN resource', async () => {
    prompter.pick = jest.fn().mockReturnValueOnce('mockcfnresourcename');

    await run(mockContext);
    expect(updateCloudFormationWalkthrough_mock).toHaveBeenCalledWith(mockContext, 'mockcfnresourcename');
  });

  it('update custom workflow is invoked for a CDK resource', async () => {
    prompter.pick = jest.fn().mockReturnValueOnce('mockcdkresourcename');

    prompter.yesOrNo = jest.fn().mockReturnValueOnce(true);

    await run(mockContext);

    expect(mockContext.amplify.openEditor).toHaveBeenCalledTimes(1);
  });
});
