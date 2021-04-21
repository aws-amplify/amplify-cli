import { $TSAny, $TSContext } from 'amplify-cli-core';
const category = 'function';
const lambdaLayerPrompt = 'lambdaLayerPrompt';
const postPushCleanUpFunctionName = 'postPushCleanUp';
export async function prePushLambdaLayerPrompt(context: $TSContext, resources: Array<$TSAny>): Promise<void> {
  await context.amplify.invokePluginMethod(context, category, undefined, lambdaLayerPrompt, [context, resources]);
}

export async function postPushLambdaLayerCleanUp(context: $TSContext, resources: Array<$TSAny>, envName: string): Promise<void> {
  context.amplify.invokePluginMethod(context, category, undefined, postPushCleanUpFunctionName, [context, resources, envName]);
}
