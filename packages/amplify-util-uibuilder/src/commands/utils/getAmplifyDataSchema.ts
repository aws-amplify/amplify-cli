import {
  $TSContext, stateManager, AmplifyCategories, AmplifySupportedService,
} from 'amplify-cli-core';
import { GenericDataSchema, getGenericFromDataStore } from '@aws-amplify/codegen-ui';
import { getAppId, getEnvName } from './environmentHelpers';
import { AmplifyClientFactory } from '../../clients';

/**
 * If models are available, they will be populated in the models field of the returned object.
 * If they're not available, the error field on the returned object will be an Error and models field will be undefined
 */
export const getAmplifyDataSchema = async (
  context: $TSContext,
  envName?: string,
): Promise<{ dataSchema?: ReturnType<typeof getSchema>; error?: Error }> => {
  const environmentName = getEnvName(context, envName);
  const appId = await getAppId(context);

  try {
    const meta = stateManager.getCurrentMeta();
    const resourceName = Object.entries(meta[AmplifyCategories.API]).filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ([, value]) => (value as any)?.service === AmplifySupportedService.APPSYNC,
    )[0][0];

    const { Models } = await AmplifyClientFactory.amplifyBackend
      .getBackendAPIModels({
        AppId: appId,
        BackendEnvironmentName: environmentName,
        ResourceName: resourceName,
      })
      .promise();
    if (!Models) {
      return { error: new Error('Models not found in AmplifyBackend:GetBackendAPIModels response') };
    }
    return { dataSchema: getSchema(Models) };
  } catch (error) {
    return { error };
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getSchema = (schemaString: string): GenericDataSchema => {
  const source = schemaString.replace(schemaString.substring(0, schemaString.indexOf(`{`) - 1), ``).replace(/;/g, ``);
  return getGenericFromDataStore(JSON.parse(source));
};
