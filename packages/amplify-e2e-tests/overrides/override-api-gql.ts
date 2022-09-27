import * as AmplifyHelpers from '@aws-amplify/cli-extensibility-helper';

export function override(resource: any): any {

  // This tests that proper builtin packages are allowed when calling an override with vm2.
  AmplifyHelpers.getProjectInfo();

  resource.api.GraphQLAPI.xrayEnabled = true;
}
