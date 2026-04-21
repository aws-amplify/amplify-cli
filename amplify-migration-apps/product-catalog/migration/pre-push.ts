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
 *
 * The "app id" used for the secret path is a static placeholder rather than
 * the real Amplify console app id. This keeps the CI flow independent of
 * Amplify console app creation (which is disabled via `disableAmplifyAppCreation`
 * when running under IS_AMPLIFY_CI) and matches the value baked into the
 * pre-refactor snapshot. The Lambda only uses this as a path segment in SSM,
 * so the literal value doesn't matter as long as `pre-push` writes the secret
 * at the same path the Lambda reads from.
 */

import fs from 'fs';
import path from 'path';
import { SSMClient, PutParameterCommand } from '@aws-sdk/client-ssm';

const SECRETS_PATH_APP_ID = 'productcatalog';

function readEnvName(appPath: string): string {
  const tpiPath = path.join(appPath, 'amplify', 'team-provider-info.json');
  const tpi = JSON.parse(fs.readFileSync(tpiPath, 'utf-8'));
  return Object.keys(tpi)[0];
}

function readDeploymentName(appPath: string): string {
  const packageJsonPath = path.join(appPath, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  return packageJson.name as string;
}

function updateCustomRoles(appPath: string, appName: string): void {
  const filePath = path.join(appPath, 'amplify', 'backend', 'api', 'productcatalog', 'custom-roles.json');
  // Gen2 trims role name prefixes to 10 characters
  const trimmedName = appName.slice(0, 10);
  fs.writeFileSync(filePath, JSON.stringify({ adminRoleNames: [`amplify-${trimmedName}`] }, null, 2), 'utf-8');
}

function setFunctionParameters(appPath: string, envName: string): void {
  const tpiPath = path.join(appPath, 'amplify', 'team-provider-info.json');
  const tpi = JSON.parse(fs.readFileSync(tpiPath, 'utf-8'));

  tpi[envName].categories ??= {};
  tpi[envName].categories.function ??= {};
  tpi[envName].categories.function.lowstockproducts = {
    ...tpi[envName].categories.function.lowstockproducts,
    lowStockThreshold: '5',
    secretsPathAmplifyAppId: SECRETS_PATH_APP_ID,
  };
  fs.writeFileSync(tpiPath, JSON.stringify(tpi, null, 2), 'utf-8');
}

async function createGen1Secret(envName: string): Promise<void> {
  const parameterName = `/amplify/${SECRETS_PATH_APP_ID}/${envName}/AMPLIFY_lowstockproducts_PRODUCT_CATALOG_SECRET`;
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

  const envName = readEnvName(appPath);
  const appName = readDeploymentName(appPath);

  updateCustomRoles(appPath, appName);
  setFunctionParameters(appPath, envName);
  await createGen1Secret(envName);
}

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
