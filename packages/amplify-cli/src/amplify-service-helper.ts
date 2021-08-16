import { $TSObject, $TSContext, pathManager, stateManager } from 'amplify-cli-core';
import { isDataStoreEnabled } from 'graphql-transformer-core';
import { normalizeInputParams } from './input-params-manager';
import * as path from 'path';
import _ from 'lodash';

export function constructInputParams(context: $TSContext) {
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
}

export const postPullCodegen = async (context: $TSContext) => {
  if (!!context?.exeInfo?.inputParams?.['no-codegen']) {
    return;
  }
  const meta = stateManager.getCurrentMeta(undefined, { throwIfNotExist: false });
  const gqlApiName = _.entries(meta?.api).find(([_, value]) => (value as { service: string }).service === 'AppSync')?.[0];
  if (!gqlApiName) {
    return;
  }
  if (await isDataStoreEnabled(path.join(pathManager.getBackendDirPath(), 'api', gqlApiName))) {
    await context.amplify.invokePluginMethod(context, 'codegen', undefined, 'generateModels', [context]);
  }
};
