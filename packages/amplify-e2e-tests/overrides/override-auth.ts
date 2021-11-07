export function override(props: any): any {
  props.userPool.deviceConfiguration = {
    challengeRequiredOnNewDevice: true,
  };
  return props;
}
