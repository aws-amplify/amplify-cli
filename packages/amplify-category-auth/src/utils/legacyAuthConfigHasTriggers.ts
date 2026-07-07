import { AmplifyCategories, stateManager } from '@aws-amplify/amplify-cli-core';

/**
 * Function that determines if the given auth resource has triggers configured using the format before CLI v7 (parameters.json)
 */
export const legacyAuthConfigHasTriggers = (authResourceName: string): boolean => {
  /**
   * Auth params should be an object of the form
   * {
   *   ...
   *   triggers: "{JSON encoded object}" // object with non-zero number of keys indicates that triggers exist
   * }
   */
  const authParams = stateManager.getResourceParametersJson(undefined, AmplifyCategories.AUTH, authResourceName, {
    throwIfNotExist: false,
  });
  if (
    authParams === null ||
    authParams === undefined ||
    typeof authParams !== 'object' ||
    !('triggers' in authParams) ||
    typeof authParams.triggers !== 'string'
  ) {
    return false;
  }
  try {
    const triggerConfig = JSON.parse(authParams.triggers) as unknown;
    if (triggerConfig === null || typeof triggerConfig !== 'object') {
      return false;
    }
    if (Object.keys(triggerConfig).length > 0) {
      return true;
    }
    return false;
  } catch {
    // trigger config couldn't be JSON parsed. This will probably be an error somewhere else but right here we don't know so return false
    return false;
  }
};
