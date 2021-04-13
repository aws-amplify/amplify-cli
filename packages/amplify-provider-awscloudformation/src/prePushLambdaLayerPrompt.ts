import { $TSAny, $TSContext } from 'amplify-cli-core';
const category = 'function';
const lambdaLayerPrompt = 'lambdaLayerPrompt';

export async function prePushLambdaLayerPrompt(context: $TSContext, resources: Array<$TSAny>): Promise<void> {
  await context.amplify.invokePluginMethod(context, category, undefined, lambdaLayerPrompt, [context, resources]);
}
