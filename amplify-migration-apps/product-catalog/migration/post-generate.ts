#!/usr/bin/env npx ts-node
/**
 * Post-generate script for product-catalog app.
 *
 * Applies manual edits required after `amplify gen2-migration generate`:
 * 1. Update branchName in amplify/data/resource.ts to "sandbox"
 * 2. Convert lowstockproducts function from CommonJS to ESM
 * 3. Replace fetchSecret() with process.env in lowstockproducts
 * 4. Update lowstockproducts/resource.ts to use secret() instead of hardcoded SSM path
 * 5. Convert S3Trigger function from CommonJS to ESM
 * 6. Update frontend import from amplifyconfiguration.json to amplify_outputs.json
 * 7. Add IAM policy to backend.ts for authenticated user to access Gen1 AppSync API
 */

import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

async function updateBranchName(appPath: string): Promise<void> {
  const resourcePath = path.join(appPath, 'amplify', 'data', 'resource.ts');
  const content = await fs.readFile(resourcePath, 'utf-8');

  const targetBranch = 'sandbox';

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

async function addGen1AppSyncPolicy(appPath: string): Promise<void> {
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

  // Append the IAM policy statement before the last line or at the end of the file
  // We add a placeholder that the user must fill in with their Gen1 AppSync API ID
  const policyBlock = `
backend.auth.resources.authenticatedUserIamRole.addToPrincipalPolicy(new aws_iam.PolicyStatement({
    effect: aws_iam.Effect.ALLOW,
    actions: ['appsync:GraphQL'],
    resources: [\`arn:aws:appsync:\${backend.data.stack.region}:\${backend.data.stack.account}:apis/<gen1-appsync-api-id>/*\`]
}))
`;

  updated = updated.trimEnd() + '\n' + policyBlock;

  await fs.writeFile(backendPath, updated, 'utf-8');
}

export async function postGenerate(appPath: string): Promise<void> {
  await updateBranchName(appPath);
  await convertLowstockproductsToESM(appPath);
  await updateLowstockproductsResource(appPath);
  await convertS3TriggerToESM(appPath);
  await updateFrontendConfig(appPath);
  await addGen1AppSyncPolicy(appPath);
}

async function main(): Promise<void> {
  const [appPath] = process.argv.slice(2);
  await postGenerate(appPath);
}

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
