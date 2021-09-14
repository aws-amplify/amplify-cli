export function getSandboxModeEnvNameFromNodeMap(input: any): string {
  const ampGlobalType: any = input.AMPLIFY_GLOBAL;

  if (!ampGlobalType) return '';

  return getSandboxModeEnvNameFromDirectiveSet(ampGlobalType.directives);
}

export function getSandboxModeEnvNameFromDirectiveSet(input: any): string {
  const sandboxModeDirective = input.find((el: any) => el.name.value === 'allow_public_data_access_with_api_key');

  if (!sandboxModeDirective) return '';

  const inField = sandboxModeDirective.arguments.find((el: any) => el.name.value === 'in');
  return inField.value.value;
}
