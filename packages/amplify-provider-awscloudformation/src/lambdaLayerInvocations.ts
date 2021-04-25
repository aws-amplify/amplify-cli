import { $TSAny, $TSContext } from 'amplify-cli-core';

const category = 'function';
const lambdaLayerPrompt = 'lambdaLayerPrompt';
const postPushCleanUpFunctionName = 'postPushCleanUp';
// TODO centralize this to share between this and push-resources
const FunctionServiceNameLambdaLayer = 'LambdaLayer';

export async function prePushLambdaLayerPrompt(context: $TSContext, resources: Array<$TSAny>): Promise<void> {
  await context.amplify.invokePluginMethod(context, category, FunctionServiceNameLambdaLayer, lambdaLayerPrompt, [context, resources]);
}

export async function postPushLambdaLayerCleanUp(context: $TSContext, resources: Array<$TSAny>, envName: string): Promise<void> {
  context.amplify.invokePluginMethod(context, category, FunctionServiceNameLambdaLayer, postPushCleanUpFunctionName, [resources, envName]);
}
