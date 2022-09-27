import * as AmplifyHelpers from '@aws-amplify/cli-extensibility-helper';

export function override(resources: any) {

  // This tests that proper builtin packages are allowed when calling an override with vm2.
  AmplifyHelpers.getProjectInfo();

  const desc = {
    'Fn::Join': [' ', ['Description', 'override', 'successful']],
  };

  resources.addCfnParameter(
    {
      type: 'String',
      description: 'Test parameter',
    },
    'DESCRIPTION',
    desc,
  );

  resources.restApi.description = { Ref: 'DESCRIPTION' };
}
