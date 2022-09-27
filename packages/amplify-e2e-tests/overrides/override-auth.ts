import * as AmplifyHelpers from '@aws-amplify/cli-extensibility-helper';

export function override(props: any): any {

  // This tests that proper builtin packages are allowed when calling an override with vm2.
  AmplifyHelpers.getProjectInfo();

  props.userPool.deviceConfiguration = {
    challengeRequiredOnNewDevice: true,
  };
  props.userPool.userAttributeUpdateSettings = {
    attributesRequireVerificationBeforeUpdate: ['email'],
  };
  return props;
}
