#!/usr/bin/env npx ts-node
/**
 * Pre-push script for product-catalog app.
 *
 * 1. Substitutes the real Amplify app ID into custom-roles.json so that
 *    the S3 trigger Lambda (which uses IAM auth) gets admin access to
 *    the AppSync API.
 * 2. Sets the lowStockThreshold and secretsPathAmplifyAppId parameters
 *    in team-provider-info.json for the current environment so that
 *    `amplify push --yes` doesn't prompt for missing values.
 * 3. Creates the PRODUCT_CATALOG_SECRET in SSM Parameter Store so the
 *    Gen1 lowstockproducts Lambda can resolve it at runtime.
 */

import fs from 'fs';
import path from 'path';
import { SSMClient, PutParameterCommand } from '@aws-sdk/client-ssm';

function readAmplifyAppId(appPath: string): string {
  const metaPath = path.join(appPath, 'amplify', 'backend', 'amplify-meta.json');
  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
  return meta.providers?.awscloudformation?.AmplifyAppId as string;
}

function readEnvName(appPath: string): string {
  const tpiPath = path.join(appPath, 'amplify', 'team-provider-info.json');
  const tpi = JSON.parse(fs.readFileSync(tpiPath, 'utf-8'));
  return Object.keys(tpi)[0];
}

function updateCustomRoles(appPath: string, amplifyAppId: string): void {
  const filePath = path.join(appPath, 'amplify', 'backend', 'api', 'productcatalog', 'custom-roles.json');
  fs.writeFileSync(filePath, JSON.stringify({ adminRoleNames: [`amplify-${amplifyAppId}`] }, null, 2), 'utf-8');
}

function setFunctionParameters(appPath: string, envName: string, amplifyAppId: string): void {
  const tpiPath = path.join(appPath, 'amplify', 'team-provider-info.json');
  const tpi = JSON.parse(fs.readFileSync(tpiPath, 'utf-8'));

  tpi[envName].categories ??= {};
  tpi[envName].categories.function ??= {};
  tpi[envName].categories.function.lowstockproducts = {
    ...tpi[envName].categories.function.lowstockproducts,
    lowStockThreshold: '5',
    secretsPathAmplifyAppId: amplifyAppId,
  };
  fs.writeFileSync(tpiPath, JSON.stringify(tpi, null, 2), 'utf-8');
}

async function createGen1Secret(amplifyAppId: string, envName: string): Promise<void> {
  const parameterName = `/amplify/${amplifyAppId}/${envName}/AMPLIFY_lowstockproducts_PRODUCT_CATALOG_SECRET`;
  const ssm = new SSMClient({});
  await ssm.send(new PutParameterCommand({
    Name: parameterName,
    Value: 'e2e-test-secret-value',
    Type: 'SecureString',
    Overwrite: true,
  }));
}

async function main(): Promise<void> {
  const [appPath = process.cwd()] = process.argv.slice(2);

  const amplifyAppId = readAmplifyAppId(appPath);
  const envName = readEnvName(appPath);

  updateCustomRoles(appPath, amplifyAppId);
  setFunctionParameters(appPath, envName, amplifyAppId);
  await createGen1Secret(amplifyAppId, envName);
}

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
