import { $TSAny, $TSContext } from 'amplify-cli-core';
import { FunctionServiceNameLambdaLayer } from './constants';

const category = 'function';
const lambdaLayerPrompt = 'lambdaLayerPrompt';
const postPushCleanupFunctionName = 'postPushCleanup';

export async function prePushLambdaLayerPrompt(context: $TSContext, resources: Array<$TSAny>): Promise<void> {
  await context.amplify.invokePluginMethod(context, category, FunctionServiceNameLambdaLayer, lambdaLayerPrompt, [context, resources]);
}

export async function postPushLambdaLayerCleanup(context: $TSContext, resources: Array<$TSAny>, envName: string): Promise<void> {
  context.amplify.invokePluginMethod(context, category, FunctionServiceNameLambdaLayer, postPushCleanupFunctionName, [resources, envName]);
}
