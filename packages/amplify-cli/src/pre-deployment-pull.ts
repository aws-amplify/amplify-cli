import { createAmplifySkeletonProject } from 'amplify-app';
import fetch from 'node-fetch';
import fs from 'fs-extra';
import { $TSContext, pathManager } from 'amplify-cli-core';

export async function preDeployPullBackend(context: $TSContext, sandboxId: string) {
  const providerPlugin = await import(context.amplify.getProviderPlugins(context).awscloudformation);

  const url = `${providerPlugin.adminBackendMap['us-east-1'].appStateUrl}/AppState/${sandboxId}`;

  // Fetch schema
  const res = await fetch(`${url}`);
  const resJson = await res.json();

  // App not present
  if (resJson.message === 'Requested app was not found') {
    context.print.error('Requested app was not found');
    return;
  }

  // Handle Deployed App Case
  if (resJson.appId) {
    context.print.error(`This app is already deployed. You can pull it using "amplify pull --appId ${resJson.appId}"`);
    return;
  }

  // Handle missing schema
  if (!resJson.schema) {
    context.print.error('No GraphQL schema found in the app.');
    return;
  }

  // Create base-skeleton amplify-folder
  const amplifyDirPath = pathManager.getAmplifyDirPath(process.cwd());
  if (!fs.existsSync(amplifyDirPath)) {
    await createAmplifySkeletonProject();
  }

  // Generate models
  await context.amplify.invokePluginMethod(context, 'codegen', null, 'generateModels', [context]);
}
