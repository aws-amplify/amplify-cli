import * as AmplifyHelpers from '@aws-amplify/cli-extensibility-helper';

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}
export function override(props: any): void {

  // This tests that proper builtin packages are allowed when calling an override with vm2.
  AmplifyHelpers.getProjectInfo();

  props.authRole.roleName = `mockRole-${getRandomInt(10000)}`;
  return props;
}
