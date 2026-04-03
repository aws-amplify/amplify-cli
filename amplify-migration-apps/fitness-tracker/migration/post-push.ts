#!/usr/bin/env npx ts-node
/**
 * Post-push script for fitness-tracker app.
 *
 * The PreSignUp trigger has a DOMAINALLOWLIST env var that defaults to ""
 * in the CloudFormation template. After push, we update the Lambda's
 * environment to include "amazon.com" so test user provisioning works.
 */

import fs from 'fs';
import path from 'path';
import {
  LambdaClient,
  UpdateFunctionConfigurationCommand,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';

async function main(): Promise<void> {
  const [appPath] = process.argv.slice(2);

  const metaPath = path.join(appPath, 'amplify', 'backend', 'amplify-meta.json');
  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));

  const preSignupEntry = Object.entries(meta.function ?? {})
    .find(([name]) => name.includes('PreSignup'));

  if (!preSignupEntry) {
    throw new Error('No PreSignup function found in amplify-meta.json');
  }

  const functionName = (preSignupEntry[1] as any).output?.Name as string;
  if (!functionName) {
    throw new Error(`PreSignup entry '${preSignupEntry[0]}' has no output.Name`);
  }

  const lambda = new LambdaClient({});

  const config = await lambda.send(new GetFunctionConfigurationCommand({ FunctionName: functionName }));
  const env = config.Environment?.Variables ?? {};

  await lambda.send(new UpdateFunctionConfigurationCommand({
    FunctionName: functionName,
    Environment: { Variables: { ...env, DOMAINALLOWLIST: 'amazon.com' } },
  }));

  console.log(`✅ Updated DOMAINALLOWLIST on ${functionName}`);
}

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
