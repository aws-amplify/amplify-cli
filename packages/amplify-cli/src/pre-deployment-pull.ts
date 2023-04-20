import { run } from '@aws-amplify/amplify-app';
import { $TSContext, AmplifyError, AMPLIFY_SUPPORT_DOCS, pathManager } from '@aws-amplify/amplify-cli-core';
import * as fs from 'fs-extra';
import fetch from 'node-fetch';
import * as path from 'path';

/**
 * pre deployment pull step and validations
 */
export const preDeployPullBackend = async (context: $TSContext, sandboxId: string): Promise<void> => {
  const providerPlugin = await import(context.amplify.getProviderPlugins(context).awscloudformation);
  // environment variable AMPLIFY_CLI_APPSTATE_BASE_URL useful for development against beta/gamma appstate endpoints
  const appStateBaseUrl = process.env.AMPLIFY_CLI_APPSTATE_BASE_URL ?? providerPlugin.adminBackendMap['us-east-1'].appStateUrl;
  const url = `${appStateBaseUrl}/AppState/${sandboxId}`;

  // Fetch schema
  const res = await fetch(`${url}`);
  const resJson = await res.json();

  // App not present
  if (resJson.message === 'Requested app was not found') {
    throw new AmplifyError('ProjectNotFoundError', {
      message: `Requested app: ${sandboxId} was not found`,
      link: `${AMPLIFY_SUPPORT_DOCS.CLI_PROJECT_TROUBLESHOOTING.url}`,
    });
  }

  // Handle Deployed App Case
  if (resJson.appId) {
    throw new AmplifyError('DeploymentError', {
      message: 'This app is already deployed.',
      resolution: `You can pull it using "amplify pull --appId ${resJson.appId}"`,
    });
  }

  // Handle missing schema
  if (!resJson.schema) {
    throw new AmplifyError('ApiCategorySchemaNotFoundError', {
      message: 'No GraphQL schema found in the app.',
      link: `${AMPLIFY_SUPPORT_DOCS.CLI_GRAPHQL_TROUBLESHOOTING.url}`,
    });
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
};

const replaceSchema = (schema: string): void => {
  const schemaFilePath = path.join(process.cwd(), 'amplify', 'backend', 'api', 'amplifyDatasource', 'schema.graphql');
  fs.writeFileSync(schemaFilePath, schema);
};
