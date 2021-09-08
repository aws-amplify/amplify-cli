import { defineGlobalSandboxMode } from '../../../../provider-utils/awscloudformation/utils/global-sandbox-mode';
import { $TSContext } from 'amplify-cli-core';

describe('global sandbox mode GraphQL directive', () => {
  it('returns AMPLIFY_DIRECTIVE type with code comment, directive, and env name', () => {
    const envName = 'envone';
    const ctx = <$TSContext>{
      amplify: {
        getEnvInfo() {
          return { envName };
        },
      },
    };

    expect(defineGlobalSandboxMode(ctx))
      .toBe(`# This allows public create, read, update, and delete access for a limited time to all models via API Key.
# To configure PRODUCTION-READY authorization rules, review: https://docs.amplify.aws/cli/graphql-transformer/auth
type AMPLIFY_GLOBAL @allow_public_data_access_with_api_key(in: \"${envName}\") # FOR TESTING ONLY!\n
`);
  });
});
