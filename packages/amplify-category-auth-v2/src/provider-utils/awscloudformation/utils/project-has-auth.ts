import { messages } from '../assets/string-maps';

/**
 * Checks if auth already exists in the project and prints a warning if so.
 * Returns true if auth already exists, false otherwise
 * @param context The amplify context
 */
export const projectHasAuth = (context: any) => {
  const existingAuth = context.amplify.getProjectDetails().amplifyMeta.auth || {};

  if (Object.keys(existingAuth).length > 0) {
    context.print.warning(messages.authExists);
    return true;
  }
  return false;
};
