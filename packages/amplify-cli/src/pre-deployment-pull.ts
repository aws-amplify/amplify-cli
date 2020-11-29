import { run } from 'amplify-app';
import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs-extra';
import { AppAlreadyDeployedError, AppNotFoundError, SchemaDoesNotExistError, $TSContext, pathManager } from 'amplify-cli-core';

export async function preDeployPullBackend(context: $TSContext, sandboxId: string) {
  const providerPlugin = await import(context.amplify.getProviderPlugins(context).awscloudformation);

  const url = `${providerPlugin.adminBackendMap['us-east-1'].appStateUrl}/AppState/${sandboxId}`;

  // Fetch schema
  const res = await fetch(`${url}`);
  const resJson = await res.json();

  // App not present
  const appNotFoundMessage = 'Requested app was not found';
  if (resJson.message === appNotFoundMessage) {
    context.print.error(appNotFoundMessage);
    context.usageData.emitError(new AppNotFoundError(appNotFoundMessage));
    process.exitCode = 1;
    return;
  }

  // Handle Deployed App Case
  if (resJson.appId) {
    const deployedErrorMessage = `This app is already deployed. You can pull it using "amplify pull --appId ${resJson.appId}"`;
    context.print.error(deployedErrorMessage);
    context.usageData.emitError(new AppAlreadyDeployedError(deployedErrorMessage));
    process.exitCode = 1;
    return;
  }

  // Handle missing schema
  if (!resJson.schema) {
    const missingSchemaMessage = 'No GraphQL schema found in the app.';
    context.print.error(missingSchemaMessage);
    context.usageData.emitError(new SchemaDoesNotExistError(missingSchemaMessage));
    process.exitCode = 1;
    return;
  }

  // Create base-skeleton amplify-folder
  const amplifyDirPath = pathManager.getAmplifyDirPath(process.cwd());
  if (!fs.existsSync(amplifyDirPath)) {
    await run({ skipEnvCheck: true });
  }
  // Replace base schema with the schema configured in Backend-manager app
  replaceSchema(resJson.schema);

  // Generate models
  await context.amplify.invokePluginMethod(context, 'codegen', null, 'generateModels', [context]);
}

function replaceSchema(schema: string) {
  const schemaFilePath = path.join(process.cwd(), 'amplify', 'backend', 'api', 'amplifyDatasource', 'schema.graphql');
  fs.writeFileSync(schemaFilePath, schema);
}
