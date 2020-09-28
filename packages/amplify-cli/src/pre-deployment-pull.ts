import { createAmplifySkeletonProject } from 'amplify-app';
import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs-extra';
import { spawn } from 'child_process';

export async function preDeployPullBackend(context, backendManagerAppId: string) {
  const url = `https://oxfsx40moe.execute-api.us-east-1.amazonaws.com/beta/AppState/${backendManagerAppId}`;

  // Fetch schema
  const res = await fetch(`${url}`);
  const resJson = await res.json();

  // App not present
  if (resJson.message && resJson.message === 'Requested app was not found') {
    context.print.error('Requested app was not found');
    return;
    // throw new Error('Requested app was not found');
  }

  // Handle Deployed App Case
  if (resJson.appId) {
    context.print.error('App is already deployed');
    return;
  }

  // Handle pre-deployed app case
  if (!resJson.schema) {
    context.print.error('Missing schema in the app.');
    return;
  }

  // Create base-skeleton amplify-folder
  await createAmplifySkeletonProject();

  // Replace base schema with the schema configured in Backend-manager app
  const schema = resJson.schema;
  replaceSchema(schema);

  // Generate models
  await generateDatastoreModels();
}

function replaceSchema(schema: string) {
  const schemaFilePath = path.join(process.cwd(), 'amplify', 'backend', 'api', 'amplifyDatasource', 'schema.graphql');
  fs.writeFileSync(schemaFilePath, schema);
}

async function generateDatastoreModels() {
  return new Promise((resolve, reject) => {
    let amplify = /^win/.test(process.platform) ? 'amplify.cmd' : 'amplify';
    if (process.env.AMPLIFY_DEV === 'true') {
      amplify = /^win/.test(process.platform) ? 'amplify-dev.cmd' : 'amplify-dev';
    }
    const runModelgen = spawn(amplify, ['codegen', 'models'], {
      cwd: process.cwd(),
      env: process.env,
      stdio: 'inherit',
    });

    runModelgen.on('exit', code => {
      if (code == 0) {
        resolve();
      } else {
        console.log(`Failed to generate Datastore models.`);
        reject();
      }
    });
  });
}
