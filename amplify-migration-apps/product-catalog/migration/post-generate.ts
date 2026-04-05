#!/usr/bin/env npx ts-node
/**
 * Post-generate script for product-catalog app.
 *
 * Applies manual edits required after `amplify gen2-migration generate`:
 * 1. Update branchName in amplify/data/resource.ts to the value of AWS_BRANCH
 *    env var, or the current git branch if AWS_BRANCH is not set
 * 2. Convert lowstockproducts function from CommonJS to ESM
 * 3. Replace fetchSecret() with process.env in lowstockproducts
 * 4. Update lowstockproducts/resource.ts to use secret() instead of hardcoded SSM path
 * 5. Convert S3Trigger function from CommonJS to ESM
 * 6. Update frontend import from amplifyconfiguration.json to amplify_outputs.json
 * 7. Add IAM policy to backend.ts for authenticated user to access Gen1 AppSync API
 * 8. Resolve the Gen1 AppSync API ID and replace the placeholder in backend.ts
 */

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import { AppSyncClient, paginateListGraphqlApis } from '@aws-sdk/client-appsync';

function resolveTargetBranch(): string {
  if (process.env.AWS_BRANCH) {
    return process.env.AWS_BRANCH;
  }
  return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
}

async function updateBranchName(appPath: string): Promise<void> {
  const resourcePath = path.join(appPath, 'amplify', 'data', 'resource.ts');
  const content = await fs.readFile(resourcePath, 'utf-8');

  const targetBranch = resolveTargetBranch();

  const updated = content.replace(
    /branchName:\s*['"]([^'"]+)['"]/,
    `branchName: '${targetBranch}'`,
  );

  await fs.writeFile(resourcePath, updated, 'utf-8');
}

async function convertLowstockproductsToESM(appPath: string): Promise<void> {
  const handlerPath = path.join(appPath, 'amplify', 'function', 'lowstockproducts', 'index.js');
  const content = await fs.readFile(handlerPath, 'utf-8');

  let updated = content.replace(
    /exports\.handler\s*=\s*async\s*\((\w*)\)\s*=>\s*\{/g,
    'export async function handler($1) {',
  );

  updated = updated.replace(
    /module\.exports\.handler\s*=\s*async\s*\((\w*)\)\s*=>\s*\{/g,
    'export async function handler($1) {',
  );

  // Replace fetchSecret() call with process.env lookup
  updated = updated.replace(
    /const\s+secretValue\s*=\s*await\s+fetchSecret\(\);?/g,
    "const secretValue = process.env['PRODUCT_CATALOG_SECRET'];",
  );

  await fs.writeFile(handlerPath, updated, 'utf-8');
}

async function updateLowstockproductsResource(appPath: string): Promise<void> {
  const resourcePath = path.join(appPath, 'amplify', 'function', 'lowstockproducts', 'resource.ts');
  const content = await fs.readFile(resourcePath, 'utf-8');

  // Add secret to the import from @aws-amplify/backend
  let updated = content.replace(
    /import\s*\{\s*defineFunction\s*\}\s*from\s*["']@aws-amplify\/backend["']/,
    'import { defineFunction, secret } from "@aws-amplify/backend"',
  );

  // Replace hardcoded SSM path with secret()
  updated = updated.replace(
    /PRODUCT_CATALOG_SECRET:\s*["'][^"']+["']/,
    'PRODUCT_CATALOG_SECRET: secret("PRODUCT_CATALOG_SECRET")',
  );

  await fs.writeFile(resourcePath, updated, 'utf-8');
}

async function convertS3TriggerToESM(appPath: string): Promise<void> {
  // The S3 trigger has a dynamic suffix — find it via glob
  const pattern = path.join(appPath, 'amplify', 'storage', 'S3Trigger*', 'index.js');
  const matches = await glob(pattern);

  for (const handlerPath of matches) {
    const content = await fs.readFile(handlerPath, 'utf-8');

    let updated = content.replace(
      /exports\.handler\s*=\s*async\s*(function\s*)?\((\w*)\)\s*=>\s*\{/g,
      'export async function handler($2) {',
    );

    // Also handle: exports.handler = async function (event) {
    updated = updated.replace(
      /exports\.handler\s*=\s*async\s+function\s*\((\w*)\)\s*\{/g,
      'export async function handler($1) {',
    );

    await fs.writeFile(handlerPath, updated, 'utf-8');
  }
}

async function updateFrontendConfig(appPath: string): Promise<void> {
  const mainPath = path.join(appPath, 'src', 'main.tsx');
  const content = await fs.readFile(mainPath, 'utf-8');

  const updated = content.replace(
    /from\s*["']\.\/amplifyconfiguration\.json["']/g,
    "from '../amplify_outputs.json'",
  );

  await fs.writeFile(mainPath, updated, 'utf-8');
}

/**
 * Look up the Gen1 AppSync API ID by querying all APIs and finding
 * the one tagged with "user:Application" matching the app name.
 */
async function resolveGen1AppSyncApiId(appName: string): Promise<string> {
  const client = new AppSyncClient({});

  for await (const page of paginateListGraphqlApis({ client }, {})) {
    for (const api of page.graphqlApis ?? []) {
      if (api.tags?.['user:Application'] === appName) {
        return api.apiId!;
      }
    }
  }

  throw new Error(`No AppSync API found with tag user:Application=${appName}`);
}

async function addGen1AppSyncPolicy(appPath: string, appName: string): Promise<void> {
  const apiId = await resolveGen1AppSyncApiId(appName);

  const backendPath = path.join(appPath, 'amplify', 'backend.ts');
  const content = await fs.readFile(backendPath, 'utf-8');

  // Add aws_iam to the Duration import from aws-cdk-lib
  let updated = content.replace(
    /import\s*\{([^}]*)\bDuration\b([^}]*)\}\s*from\s*["']aws-cdk-lib["']/,
    (match, before, after) => {
      if (match.includes('aws_iam')) return match;
      return `import {${before}Duration${after}, aws_iam } from "aws-cdk-lib"`;
    },
  );

  const policyBlock = `
backend.auth.resources.authenticatedUserIamRole.addToPrincipalPolicy(new aws_iam.PolicyStatement({
    effect: aws_iam.Effect.ALLOW,
    actions: ['appsync:GraphQL'],
    resources: [\`arn:aws:appsync:\${backend.data.stack.region}:\${backend.data.stack.account}:apis/${apiId}/*\`]
}))
`;

  updated = updated.trimEnd() + '\n' + policyBlock;

  await fs.writeFile(backendPath, updated, 'utf-8');
}

export async function postGenerate(appPath: string): Promise<void> {
  const packageJson = JSON.parse(await fs.readFile(path.join(appPath, 'package.json'), 'utf-8'));
  const appName = packageJson.name as string;

  await updateBranchName(appPath);
  await convertLowstockproductsToESM(appPath);
  await updateLowstockproductsResource(appPath);
  await convertS3TriggerToESM(appPath);
  await updateFrontendConfig(appPath);
  await addGen1AppSyncPolicy(appPath, appName);
}

async function main(): Promise<void> {
  const [appPath = process.cwd()] = process.argv.slice(2);
  await postGenerate(appPath);
}

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
