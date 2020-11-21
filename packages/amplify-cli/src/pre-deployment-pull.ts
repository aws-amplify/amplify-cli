import { createAmplifySkeletonProject } from 'amplify-app';
import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs-extra';
import { $TSContext } from 'amplify-cli-core';

export async function preDeployPullBackend(context: $TSContext, sandboxId: string) {
  const url = `https://rh2kdo2x79.execute-api.us-east-1.amazonaws.com/gamma/AppState/${sandboxId}`;

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
  const amplifyDirPath = path.join(process.cwd(), 'amplify');
  if (!fs.existsSync(amplifyDirPath)) {
    await createAmplifySkeletonProject();
  }

  // Replace base schema with the schema configured in Backend-manager app
  let schema = resJson.schema;
  schema = schema.replace(/\@auth\(rules\: \[\{allow\: private\, provider\: iam\}\]\)/g, '');

  replaceSchema(schema);

  // Generate models
  await context.amplify.invokePluginMethod(context, 'codegen', null, 'generateModels', [context]);
}

function replaceSchema(schema: string) {
  const schemaFilePath = path.join(process.cwd(), 'amplify', 'backend', 'api', 'amplifyDatasource', 'schema.graphql');
  fs.writeFileSync(schemaFilePath, schema);
}
