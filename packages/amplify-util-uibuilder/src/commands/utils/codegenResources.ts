import { GenericDataSchema, getGenericFromDataStore } from '@aws-amplify/codegen-ui';
import { printer } from '@aws-amplify/amplify-prompts';
import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { ModelIntrospectionSchema } from '@aws-amplify/appsync-modelgen-plugin';

/**
 * If models are available, they will be populated in the models field of the returned object.
 * If they're not available, it will return undefined
 */
export const getAmplifyDataSchema = async (context: $TSContext): Promise<GenericDataSchema | undefined> => {
  try {
    const localSchema = await context.amplify.invokePluginMethod(context, 'codegen', undefined, 'getModelIntrospection', [context]);

    if (!localSchema) {
      printer.debug('Local schema not found');
      return undefined;
    }
    return getGenericFromDataStore(localSchema as ModelIntrospectionSchema);
  } catch (e) {
    printer.debug(e.toString());
    return undefined;
  }
};
