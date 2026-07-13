#!/usr/bin/env npx ts-node
/**
 * Post-sandbox script for product-catalog app.
 *
 * Writes the PRODUCT_CATALOG_SECRET to SSM Parameter Store using the
 * path convention that ampx sandbox expects:
 *   /amplify/<app-name>/<3-last-segments-of-root-stack-name>/<secret-name>
 *
 * Requires the APP_GEN2_ROOT_STACK_NAME environment variable to be set
 * by the e2e system.
 */

import { SSMClient, PutParameterCommand } from '@aws-sdk/client-ssm';
import fs from 'fs';
import path from 'path';

function extractSsmPathSegment(stackName: string): string {
  const parts = stackName.split('-');
  return parts.slice(-3).join('-');
}

async function main(): Promise<void> {
  const [appPath = process.cwd()] = process.argv.slice(2);

  const stackName = process.env.APP_GEN2_ROOT_STACK_NAME;
  if (!stackName) {
    throw new Error('APP_GEN2_ROOT_STACK_NAME environment variable is required');
  }

  const packageJsonPath = path.join(appPath, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const appName = packageJson.name as string;

  const ssmSegment = extractSsmPathSegment(stackName);
  const parameterName = `/amplify/${appName}/${ssmSegment}/PRODUCT_CATALOG_SECRET`;

  const ssm = new SSMClient({});
  await ssm.send(
    new PutParameterCommand({
      Name: parameterName,
      Value: 'e2e-test-secret-value',
      Type: 'SecureString',
      Overwrite: true,
    }),
  );
}

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
