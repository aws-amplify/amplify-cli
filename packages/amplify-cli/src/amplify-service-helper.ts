import { $TSObject, $TSContext, pathManager, stateManager } from 'amplify-cli-core';
import { isDataStoreEnabled } from 'graphql-transformer-core';
import * as path from 'path';
import _ from 'lodash';
import { normalizeInputParams } from './input-params-manager';
import { getResourceStatus } from './extensions/amplify-helpers/resource-status';

/**
 * Construct the input params for the amplify init command
 */
export const constructInputParams = (context: $TSContext): $TSObject => {
  const inputParams: $TSObject = normalizeInputParams(context);

  if (inputParams.appId) {
    inputParams.amplify.appId = inputParams.appId;
    delete inputParams.appId;
  }

  if (inputParams.envName) {
    inputParams.amplify.envName = inputParams.envName;
    delete inputParams.envName;
  }

  if (inputParams['no-override'] !== undefined) {
    inputParams.amplify.noOverride = inputParams['no-override'];
    delete inputParams['no-override'];
  }

  return inputParams;
};

/**
 * runs codegen related post pull tasks
 */
export const postPullCodegen = async (context: $TSContext): Promise<void> => {
  if (context?.exeInfo?.inputParams?.['no-codegen']) {
    return;
  }
  const meta = stateManager.getCurrentMeta(undefined, { throwIfNotExist: false });
  const gqlApiName = _.entries(meta?.api).find(([, value]) => (value as { service: string }).service === 'AppSync')?.[0];
  await context.amplify.invokePluginMethod(context, 'ui-builder', undefined, 'executeAmplifyCommand', [context, 'generateComponents']);
  if (!gqlApiName) {
    return;
  }
  if (await isDataStoreEnabled(path.join(pathManager.getBackendDirPath(), 'api', gqlApiName))) {
    const { resourcesToBeCreated, resourcesToBeUpdated, resourcesToBeSynced, resourcesToBeDeleted } = await getResourceStatus(
      'api',
      undefined,
      undefined,
      undefined,
    );
    const apiHasChanges =
      resourcesToBeCreated.length || resourcesToBeUpdated.length || resourcesToBeSynced.length || resourcesToBeDeleted.length;
    if (apiHasChanges) {
      await context.amplify.invokePluginMethod(context, 'codegen', undefined, 'generateModels', [context]);
    }
  }
};
