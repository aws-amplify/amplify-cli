import {
  $TSContext, AmplifyCategories, IAuthResource,
} from 'amplify-cli-core';

/**
  * Push auth resources to the cloud
  * @returns Resource in Notifications category (IAmplifyResource type)
  */
export const invokeAuthPush = async (context: $TSContext): Promise<IAuthResource|undefined> => {
  const authResource = (await context.amplify.invokePluginMethod(context, AmplifyCategories.AUTH, undefined,
    'authPluginAPIPush', [context]));
  return (authResource) ? authResource as IAuthResource : undefined;
};
