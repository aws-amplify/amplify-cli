import { $TSContext } from 'amplify-cli-core';
import * as prompts from 'amplify-prompts';
import { promptToAddApiKey } from '../../../provider-utils/awscloudformation/prompt-to-add-api-key';
import * as walkthrough from '../../../provider-utils/awscloudformation/service-walkthroughs/appSync-walkthrough';
import * as cfnApiArtifactHandler from '../../../provider-utils/awscloudformation/cfn-api-artifact-handler';

jest.mock('../../../provider-utils/awscloudformation/service-walkthroughs/appSync-walkthrough', () => ({
  askApiKeyQuestions: jest.fn(),
}));

jest.mock('../../../provider-utils/awscloudformation/cfn-api-artifact-handler', () => ({
  getCfnApiArtifactHandler: jest.fn(() => {
    return { updateArtifacts: jest.fn() };
  }),
}));

jest.mock('amplify-prompts', () => ({
  prompter: {
    confirmContinue: jest.fn().mockImplementation(() => true),
  },
}));

describe('prompt to add Api Key', () => {
  it('runs through expected user flow: print info, update files', async () => {
    const envName = 'envone';
    const ctx = {
      amplify: {
        getEnvInfo() {
          return { envName };
        },
      },
    } as unknown as $TSContext;

    jest.spyOn(prompts.prompter, 'confirmContinue');
    jest.spyOn(walkthrough, 'askApiKeyQuestions');
    jest.spyOn(cfnApiArtifactHandler, 'getCfnApiArtifactHandler');

    await promptToAddApiKey(ctx);

    expect(prompts.prompter.confirmContinue).toHaveBeenCalledWith('Would you like to create an API Key?');
    expect(walkthrough.askApiKeyQuestions).toHaveBeenCalledTimes(1);
    expect(cfnApiArtifactHandler.getCfnApiArtifactHandler).toHaveBeenCalledTimes(1);
  });
});
