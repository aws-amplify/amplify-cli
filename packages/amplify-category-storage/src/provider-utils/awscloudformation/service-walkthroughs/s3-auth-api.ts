import { $TSAny, $TSContext} from "amplify-cli-core";
import { printer } from "amplify-prompts";
import { AmplifyCategories } from "amplify-cli-core";

/* This file contains all functions interacting with AUTH category */

//UPSTREAM API: function to be called from Storage to fetch or update Auth resources

/**
 * Get the name of the Auth resource used by S3
 * @param context  used to fetch all auth resources used by storage(S3)
 * @returns Name of the auth resource used by S3
 */
export  async function getAuthResourceARN( context : $TSContext ) : Promise<string> {
    let authResources = (await context.amplify.getResourceStatus('auth')).allResources;
    authResources = authResources.filter((resource: $TSAny) => resource.service === 'Cognito');
    if (authResources.length === 0) {
      throw new Error('No auth resource found. Please add it using amplify add auth');
    }
    return authResources[0].resourceName as string;
}
/**
 * Migrate all Auth resources used by Storage(S3) for Override feature.
 * @param context - used to fetch auth resources and to migrate auth resources for override-feature.
 */
export async function migrateAuthDependencyResource( context : $TSContext ) {
    const authResourceName = await getAuthResourceARN(context);
    try {
      await context.amplify.invokePluginMethod(context,
                                               AmplifyCategories.AUTH, undefined,
                                               'migrateAuthResource',
                                               [context, authResourceName ]);
    } catch (error) {
      printer.error(error as string);
      throw error;
    }
}
