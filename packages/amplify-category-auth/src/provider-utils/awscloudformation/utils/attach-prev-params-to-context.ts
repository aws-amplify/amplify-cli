import { getAuthResourceName } from '../../../utils/getAuthResourceName';
import { AuthInputState } from '../auth-inputs-manager/auth-input-state';

/**
 * Some existing code relies on the existing auth parameters being attached to context.updatingAuth
 */
export const attachPrevParamsToContext = async (context: any) => {
  const resourceName = await getAuthResourceName(context);
  const cliState = new AuthInputState(resourceName);
  context.updatingAuth = await cliState.loadResourceParameters(context, cliState.getCLIInputPayload());
};
