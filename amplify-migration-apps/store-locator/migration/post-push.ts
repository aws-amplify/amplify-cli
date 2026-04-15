#!/usr/bin/env npx ts-node
/**
 * Post-push script for store-locator app.
 *
 * The PostConfirmation trigger has a GROUP env var that defaults to ""
 * in the CloudFormation template. After push, we update the Lambda's
 * environment to include "storeLocatorAdmin" so test user provisioning works.
 */

import fs from 'fs';
import path from 'path';
import {
  LambdaClient,
  UpdateFunctionConfigurationCommand,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';

async function main(): Promise<void> {
  const [appPath = process.cwd()] = process.argv.slice(2);

  const metaPath = path.join(appPath, 'amplify', 'backend', 'amplify-meta.json');
  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));

  const postConfirmationEntry = Object.entries(meta.function ?? {})
    .find(([name]) => name.includes('PostConfirmation'));

  if (!postConfirmationEntry) {
    throw new Error('No PostConfirmation function found in amplify-meta.json');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const functionName = (postConfirmationEntry[1] as any).output?.Name as string;
  if (!functionName) {
    throw new Error(`PostConfirmation entry '${postConfirmationEntry[0]}' has no output.Name`);
  }

  const lambda = new LambdaClient({});

  const config = await lambda.send(new GetFunctionConfigurationCommand({ FunctionName: functionName }));
  const env = config.Environment?.Variables ?? {};

  await lambda.send(new UpdateFunctionConfigurationCommand({
    FunctionName: functionName,
    Environment: { Variables: { ...env, GROUP: 'storeLocatorAdmin' } },
  }));
}

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
