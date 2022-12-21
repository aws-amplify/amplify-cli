export function override(props: any): any {
  props.userPool.deviceConfiguration = {
    challengeRequiredOnNewDevice: true,
  };
  props.userPool.userAttributeUpdateSettings = {
    attributesRequireVerificationBeforeUpdate: ['email'],
  };
  return props;
}
