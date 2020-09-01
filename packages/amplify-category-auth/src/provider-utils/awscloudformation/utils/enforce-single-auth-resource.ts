import { messages } from '../assets/string-maps';

export const projectHasAuth = (context: any) => {
  const existingAuth = context.amplify.getProjectDetails().amplifyMeta.auth || {};

  if (Object.keys(existingAuth).length > 0) {
    context.print.warning(messages.authExists);
    return true;
  }
  return false;
};
