import { getAuthResourceName } from '../../../utils/getAuthResourceName';
import { getSupportedServices } from '../../supported-services';

/**
 * Some existing code relies on the existing auth parameters being attached to context.updatingAuth
 */
export const attachPrevParamsToContext = async (context: any) => {
  const resourceName = await getAuthResourceName(context);
  const providerPlugin = context.amplify.getPluginInstance(context, getSupportedServices().Cognito.provider);
  context.updatingAuth = providerPlugin.loadResourceParameters(context, 'auth', resourceName);
};
