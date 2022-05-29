import { run } from 'amplify-app';
import { $TSContext, AppAlreadyDeployedError, AppNotFoundError, pathManager, SchemaDoesNotExistError } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import * as fs from 'fs-extra';
import fetch from 'node-fetch';
import * as path from 'path';

export async function preDeployPullBackend(context: $TSContext, sandboxId: string) {
  const providerPlugin = await import(context.amplify.getProviderPlugins(context).awscloudformation);
  // environment variable AMPLIFY_CLI_APPSTATE_BASE_URL useful for development against beta/gamma appstate endpoints
  const appStateBaseUrl = process.env.AMPLIFY_CLI_APPSTATE_BASE_URL ?? providerPlugin.adminBackendMap['us-east-1'].appStateUrl;
  const url = `${appStateBaseUrl}/AppState/${sandboxId}`;

  // Fetch schema
  const res = await fetch(`${url}`);
  const resJson = await res.json();

  // App not present
  const appNotFoundMessage = 'Requested app was not found';
  if (resJson.message === appNotFoundMessage) {
    printer.error(appNotFoundMessage);
    await context.usageData.emitError(new AppNotFoundError(appNotFoundMessage));
    process.exitCode = 1;
    return;
  }

  // Handle Deployed App Case
  if (resJson.appId) {
    const deployedErrorMessage = `This app is already deployed. You can pull it using "amplify pull --appId ${resJson.appId}"`;
    printer.error(deployedErrorMessage);
    await context.usageData.emitError(new AppAlreadyDeployedError(deployedErrorMessage));
    process.exitCode = 1;
    return;
  }

  // Handle missing schema
  if (!resJson.schema) {
    const missingSchemaMessage = 'No GraphQL schema found in the app.';
    printer.error(missingSchemaMessage);
    await context.usageData.emitError(new SchemaDoesNotExistError(missingSchemaMessage));
    process.exitCode = 1;
    return;
  }

  // Create base-skeleton amplify-folder
  const amplifyDirPath = pathManager.getBackendDirPath(process.cwd());
  if (!fs.existsSync(amplifyDirPath)) {
    await run({ skipEnvCheck: true });
  }
  // Replace base schema with the schema configured in Backend-manager app
  replaceSchema(resJson.schema);

  // Generate models
  await context.amplify.invokePluginMethod(context, 'codegen', undefined, 'generateModels', [context]);
}

function replaceSchema(schema: string) {
  const schemaFilePath = path.join(process.cwd(), 'amplify', 'backend', 'api', 'amplifyDatasource', 'schema.graphql');
  fs.writeFileSync(schemaFilePath, schema);
}
