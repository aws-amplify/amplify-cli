import { $TSAny, $TSContext } from 'amplify-cli-core';
import { FunctionServiceNameLambdaLayer } from './constants';

const category = 'function';
const lambdaLayerPrompt = 'lambdaLayerPrompt';
const postPushCleanupFunctionName = 'postPushCleanup';
const migrateLegacyLayerFunctionName = 'migrateLegacyLayer';

export async function prePushLambdaLayerPrompt(context: $TSContext, resources: Array<$TSAny>): Promise<void> {
  await context.amplify.invokePluginMethod(context, category, FunctionServiceNameLambdaLayer, lambdaLayerPrompt, [context, resources]);
}

export async function postPushLambdaLayerCleanup(context: $TSContext, resources: Array<$TSAny>, envName: string) {
  await context.amplify.invokePluginMethod(context, category, FunctionServiceNameLambdaLayer, postPushCleanupFunctionName, [
    resources,
    envName,
  ]);
}

export async function legacyLayerMigration(context: $TSContext, layerName: string) {
  await context.amplify.invokePluginMethod(context, category, FunctionServiceNameLambdaLayer, migrateLegacyLayerFunctionName, [
    context,
    layerName,
  ]);
}
