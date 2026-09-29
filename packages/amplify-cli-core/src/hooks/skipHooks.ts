export function skipHooks(): boolean {
  // DO NOT CHANGE: used to skip hooks on Admin UI
  if (process.env.AMPLIFY_CLI_DISABLE_SCRIPTING_FEATURES) {
    return true;
  } else {
    return false;
  }
}
