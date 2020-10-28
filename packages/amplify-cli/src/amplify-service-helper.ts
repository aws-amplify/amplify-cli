import { $TSObject, $TSContext } from 'amplify-cli-core';
import { normalizeInputParams } from './input-params-manager';

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

export async function postPullCodeGenCheck(context: $TSContext) {
  context.print.info('');
}
