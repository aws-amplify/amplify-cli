import { defineGlobalSandboxMode } from '../../../../provider-utils/awscloudformation/utils/global-sandbox-mode';

describe('global sandbox mode GraphQL directive', () => {
  it('returns input AMPLIFY with code comment', () => {
    expect(defineGlobalSandboxMode('mockLink')).toEqual(`# This "input" configures a global authorization rule to enable public access to
# all models in this schema. Learn more about authorization rules here: mockLink
input AMPLIFY { globalAuthRule: AuthRule = { allow: public } } # FOR TESTING ONLY!\n
`);
  });
});
