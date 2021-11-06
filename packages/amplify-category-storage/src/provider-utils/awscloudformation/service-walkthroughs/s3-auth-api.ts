import { $TSAny, $TSContext } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import { AmplifyCategories } from 'amplify-cli-core';
import os from 'os';
import { S3AccessType } from '../service-walkthrough-types/s3-user-input-types';

/* This file contains all functions interacting with AUTH category */

//UPSTREAM API: function to be called from Storage to fetch or update Auth resources

/**
 * Get the name of the Auth resource used by S3
 * @param context  used to fetch all auth resources used by storage(S3)
 * @returns Name of the auth resource used by S3
 */
export async function getAuthResourceARN(context: $TSContext): Promise<string> {
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
export async function migrateAuthDependencyResource(context: $TSContext) {
  let authResourceName = undefined;
  try {
    authResourceName = await getAuthResourceARN(context);
  } catch (error) {
    //No auth resources to migrate - new project
    return;
  }
  if (authResourceName) {
    try {
      await context.amplify.invokePluginMethod(context, AmplifyCategories.AUTH, undefined, 'migrateAuthResource', [
        context,
        authResourceName,
      ]);
    } catch (error) {
      printer.error(error as string);
      throw error;
    }
  }
}

/**
 * Check if storage authentication requirements are satisfied by the configured storage
 * @param context
 * @param storageResourceName
 * @param allowUnauthenticatedIdentities
 */
export async function checkStorageAuthenticationRequirements(
  context: $TSContext,
  storageResourceName: string,
  allowUnauthenticatedIdentities: boolean,
) {
  const storageRequirements = { authSelections: 'identityPoolAndUserPool', allowUnauthenticatedIdentities };

  const checkResult: $TSAny = await context.amplify.invokePluginMethod(context, AmplifyCategories.AUTH, undefined, 'checkRequirements', [
    storageRequirements,
    context,
    'storage',
    storageResourceName,
  ]);

  // If auth is imported and configured, we have to throw the error instead of printing since there is no way to adjust the auth
  // configuration.
  if (checkResult.authImported === true && checkResult.errors && checkResult.errors.length > 0) {
    throw new Error(checkResult.errors.join(os.EOL));
  }

  if (checkResult.errors && checkResult.errors.length > 0) {
    printer.warn(checkResult.errors.join(os.EOL));
  }

  // If auth is not imported and there were errors, adjust or enable auth configuration
  if (!checkResult.authEnabled || !checkResult.requirementsMet) {
    try {
      // If this is not set as requirement, then explicitly configure it to disabled.
      if (storageRequirements.allowUnauthenticatedIdentities === undefined) {
        storageRequirements.allowUnauthenticatedIdentities = false;
      }

      await context.amplify.invokePluginMethod(context, AmplifyCategories.AUTH, undefined, 'externalAuthEnable', [
        context,
        AmplifyCategories.STORAGE,
        storageResourceName,
        storageRequirements,
      ]);
    } catch (error) {
      printer.error(error as string);
      throw error;
    }
  }
}


