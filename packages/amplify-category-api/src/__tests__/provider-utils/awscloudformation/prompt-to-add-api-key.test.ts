import chalk from 'chalk';
import { $TSContext } from 'amplify-cli-core';
import { promptToAddApiKey } from '../../../provider-utils/awscloudformation/prompt-to-add-api-key';
import * as walkthrough from '../../../provider-utils/awscloudformation/service-walkthroughs/appSync-walkthrough';
import * as cfnApiArtifactHandler from '../../../provider-utils/awscloudformation/cfn-api-artifact-handler';

jest.mock('../../../provider-utils/awscloudformation/service-walkthroughs/appSync-walkthrough', () => ({
  askApiKeyQuestions: jest.fn(),
}));

jest.mock('../../../provider-utils/awscloudformation/cfn-api-artifact-handler', () => ({
  getCfnApiArtifactHandler: jest.fn(() => {
    return { updateArtifactsWithoutCompile: jest.fn() };
  }),
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
      prompt: {
        confirm: jest.fn(() => true),
      },
    } as unknown as $TSContext;

    jest.spyOn(ctx.prompt, 'confirm');
    jest.spyOn(walkthrough, 'askApiKeyQuestions');
    jest.spyOn(cfnApiArtifactHandler, 'getCfnApiArtifactHandler');

    await promptToAddApiKey(ctx);

    expect(ctx.prompt.confirm).toHaveBeenCalledWith('Would you like to create an API Key?', true);
    expect(walkthrough.askApiKeyQuestions).toHaveBeenCalledTimes(1);
    expect(cfnApiArtifactHandler.getCfnApiArtifactHandler).toHaveBeenCalledTimes(1);
  });
});
