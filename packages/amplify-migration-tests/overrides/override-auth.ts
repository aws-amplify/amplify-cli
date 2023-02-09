export function override(props: Record<string, unknown>): Record<string, unknown> {
  props.userPool['deviceConfiguration'] = {
    challengeRequiredOnNewDevice: true,
  };
  props.userPool['userAttributeUpdateSettings'] = {
    attributesRequireVerificationBeforeUpdate: ['email'],
  };
  return props;
}
