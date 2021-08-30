import chalk from 'chalk';
import { $TSContext } from 'amplify-cli-core';
import { promptToAddApiKey } from '../../../provider-utils/awscloudformation/prompt-to-add-api-key';

describe('prompt to add Api Key', () => {
  beforeEach(() => {
    jest.mock('../../../provider-utils/awscloudformation/service-walkthroughs/appSync-walkthrough', () => ({
      askApiKeyQuestions: jest.fn(),
    }));

    jest.mock('../../../provider-utils/awscloudformation/cfn-api-artifact-handler', () => ({
      getCfnApiArtifactHandler() {
        return { updateArtifactsWithoutCompile: jest.fn() };
      },
    }));
  });

  it('runs through expected user flow: print info, update files', () => {
    const envName = 'envone';
    const ctx = {
      amplify: {
        getEnvInfo() {
          return { envName };
        },
      },
      print: {
        info: jest.fn(),
      },
      prompt: {
        confirm: jest.fn(() => true),
      },
    } as unknown as $TSContext;

    jest.spyOn(ctx.print, 'info');
    jest.spyOn(ctx.prompt, 'confirm');

    promptToAddApiKey(ctx);

    expect(ctx.print.info).toHaveBeenCalledWith(`
⚠️  WARNING: Global Sandbox Mode has been enabled, which requires a valid API key. If
you'd like to disable, remove ${chalk.green('"type AMPLIFY_GLOBAL @allow_public_data_access_with_api_key"')}
from your GraphQL schema and run 'amplify push' again. If you'd like to proceed with
sandbox mode disabled in '${ctx.amplify.getEnvInfo().envName}', do not create an API Key.
`);

    expect(ctx.prompt.confirm).toHaveBeenCalledWith('Would you like to create an API Key?', true);
  });
});
