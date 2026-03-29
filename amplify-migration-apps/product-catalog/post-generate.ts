#!/usr/bin/env npx ts-node
/**
 * Post-generate script for product-catalog app.
 *
 * Applies manual edits required after `amplify gen2-migration generate`:
 * 1. Update branchName in amplify/data/resource.ts to "sandbox"
 * 2. Add aws_iam import and appsync:GraphQL policy to amplify/backend.ts
 * 3. Fix missing awsRegion in GraphQL API userPoolConfig
 * 4. Convert lowstockproducts function from CommonJS to ESM and use secret()
 * 5. Convert S3 trigger function from CommonJS to ESM
 * 6. Update frontend import from amplifyconfiguration.json to amplify_outputs.json
 */

import fs from 'fs/promises';
import path from 'path';

interface PostGenerateOptions {
  appPath: string;
  envName?: string;
}

async function updateBranchName(appPath: string): Promise<void> {
  const resourcePath = path.join(appPath, 'amplify', 'data', 'resource.ts');
  console.log(`Updating branchName in ${resourcePath}...`);

  const content = await fs.readFile(resourcePath, 'utf-8');
  const updated = content.replace(
    /branchName:\s*['"]([^'"]+)['"]/,
    `branchName: 'sandbox'`,
  );

  if (updated === content) {
    console.log('  No branchName found to update, skipping');
    return;
  }

  await fs.writeFile(resourcePath, updated, 'utf-8');
  console.log('  Updated branchName to "sandbox"');
}

/**
 * Read the Gen1 AppSync API ID from amplify-meta.json.
 * The API name is dynamic (based on deployment name), so we scan for the first API entry.
 */
async function getGen1ApiId(appPath: string): Promise<string | undefined> {
  const metaPath = path.join(appPath, 'amplify', 'backend', 'amplify-meta.json');
  try {
    const meta = JSON.parse(await fs.readFile(metaPath, 'utf-8')) as Record<string, Record<string, Record<string, unknown>>>;
    const apis = meta.api ?? {};
    for (const apiConfig of Object.values(apis)) {
      const output = apiConfig.output as Record<string, string> | undefined;
      if (output?.GraphQLAPIIdOutput) {
        return output.GraphQLAPIIdOutput;
      }
    }
  } catch {
    // amplify-meta.json may not exist yet
  }
  return undefined;
}

/**
 * Add aws_iam import and appsync:GraphQL policy for the Gen1 API to backend.ts.
 *
 * The Gen2 auth role needs permission to call the Gen1 AppSync API during the
 * transition period when both Gen1 and Gen2 stacks coexist.
 */
async function addAppsyncPolicyToBackend(appPath: string): Promise<void> {
  const backendPath = path.join(appPath, 'amplify', 'backend.ts');
  console.log(`Adding appsync:GraphQL policy to ${backendPath}...`);

  let content: string;
  try {
    content = await fs.readFile(backendPath, 'utf-8');
  } catch {
    console.log('  backend.ts not found, skipping');
    return;
  }

  // Add aws_iam to the cdk import
  if (!content.includes('aws_iam')) {
    content = content.replace(
      /import\s*\{([^}]*)\}\s*from\s*["']aws-cdk-lib["']/,
      (match, imports: string) => {
        const trimmed = imports.trim().replace(/,\s*$/, '');
        return `import { ${trimmed}, aws_iam } from "aws-cdk-lib"`;
      },
    );
  }

  // Get the Gen1 API ID to scope the policy
  const apiId = await getGen1ApiId(appPath);
  const resourceArn = apiId
    ? `\`arn:aws:appsync:\${backend.data.stack.region}:\${backend.data.stack.account}:apis/${apiId}/*\``
    : '`arn:aws:appsync:${backend.data.stack.region}:${backend.data.stack.account}:apis/*`';

  // Add the policy statement before the last line (export or closing)
  // Look for a good insertion point — after defineBackend call or before export
  const policyBlock = `
backend.auth.resources.authenticatedUserIamRole.addToPrincipalPolicy(new aws_iam.PolicyStatement({
  effect: aws_iam.Effect.ALLOW,
  actions: ['appsync:GraphQL'],
  resources: [${resourceArn}],
}));
`;

  if (content.includes('addToPrincipalPolicy')) {
    console.log('  appsync:GraphQL policy already present, skipping');
    return;
  }

  // Insert before the last line
  const lines = content.split('\n');
  lines.splice(lines.length - 1, 0, policyBlock);
  content = lines.join('\n');

  await fs.writeFile(backendPath, content, 'utf-8');
  console.log(`  Added appsync:GraphQL policy${apiId ? ` for API ${apiId}` : ' (wildcard)'}`);
}

/**
 * Convert lowstockproducts Lambda from CommonJS to ESM and switch to secret().
 *
 * - exports.handler → export async function handler
 * - Replace SSM secret fetch with process.env['PRODUCT_CATALOG_SECRET']
 */
async function convertLowstockproductsToESM(appPath: string): Promise<void> {
  const handlerPath = path.join(appPath, 'amplify', 'function', 'lowstockproducts', 'index.js');
  console.log(`Converting lowstockproducts to ESM in ${handlerPath}...`);

  let content: string;
  try {
    content = await fs.readFile(handlerPath, 'utf-8');
  } catch {
    console.log('  index.js not found, skipping');
    return;
  }

  // Convert CommonJS exports to ESM
  let updated = content.replace(
    /exports\.handler\s*=\s*async\s*\((\w*)\)\s*=>\s*\{/g,
    'export async function handler($1) {',
  );

  // Replace SSM secret fetch with direct env var access
  updated = updated.replace(
    /const secretValue = await fetchSecret\(\);/,
    "const secretValue = process.env['PRODUCT_CATALOG_SECRET'];",
  );

  if (updated === content) {
    console.log('  No changes needed, skipping');
    return;
  }

  await fs.writeFile(handlerPath, updated, 'utf-8');
  console.log('  Converted to ESM and switched to env var secret');
}

/**
 * Update lowstockproducts resource.ts to use secret() instead of hardcoded SSM path.
 */
async function updateLowstockproductsResource(appPath: string): Promise<void> {
  const resourcePath = path.join(appPath, 'amplify', 'function', 'lowstockproducts', 'resource.ts');
  console.log(`Updating lowstockproducts resource.ts...`);

  let content: string;
  try {
    content = await fs.readFile(resourcePath, 'utf-8');
  } catch {
    console.log('  resource.ts not found, skipping');
    return;
  }

  // Add secret import
  let updated = content.replace(
    /import\s*\{\s*defineFunction\s*\}\s*from\s*["']@aws-amplify\/backend["']/,
    'import { defineFunction, secret } from "@aws-amplify/backend"',
  );

  // Replace hardcoded SSM path with secret()
  updated = updated.replace(
    /PRODUCT_CATALOG_SECRET:\s*["'][^"']+["']/,
    'PRODUCT_CATALOG_SECRET: secret("PRODUCT_CATALOG_SECRET")',
  );

  if (updated === content) {
    console.log('  No changes needed, skipping');
    return;
  }

  await fs.writeFile(resourcePath, updated, 'utf-8');
  console.log('  Updated to use secret()');
}

/**
 * Convert S3 trigger function from CommonJS to ESM.
 */
async function convertS3TriggerToESM(appPath: string): Promise<void> {
  // Find the S3 trigger directory (name varies)
  const functionDir = path.join(appPath, 'amplify', 'function');
  let triggerDir: string | undefined;

  try {
    const entries = await fs.readdir(functionDir);
    triggerDir = entries.find((e) => e.toLowerCase().includes('s3trigger'));
  } catch {
    console.log('  amplify/function directory not found, skipping');
    return;
  }

  if (!triggerDir) {
    console.log('  No S3 trigger function found, skipping');
    return;
  }

  const handlerPath = path.join(functionDir, triggerDir, 'index.js');
  console.log(`Converting S3 trigger to ESM in ${handlerPath}...`);

  let content: string;
  try {
    content = await fs.readFile(handlerPath, 'utf-8');
  } catch {
    console.log('  index.js not found, skipping');
    return;
  }

  // Convert CommonJS exports to ESM (handles both arrow and function forms)
  let updated = content.replace(
    /exports\.handler\s*=\s*async\s*function\s*\((\w*)\)\s*\{/g,
    'export async function handler($1) {',
  );
  updated = updated.replace(
    /exports\.handler\s*=\s*async\s*\((\w*)\)\s*=>\s*\{/g,
    'export async function handler($1) {',
  );

  if (updated === content) {
    console.log('  No CommonJS exports found, skipping');
    return;
  }

  await fs.writeFile(handlerPath, updated, 'utf-8');
  console.log('  Converted to ESM syntax');
}

/**
 * Fix missing awsRegion in GraphQL API userPoolConfig.
 *
 * The generated backend.ts sets additionalAuthenticationProviders with
 * userPoolConfig but omits awsRegion, causing AppSync to reject the config.
 */
async function fixUserPoolRegionInGraphqlApi(appPath: string): Promise<void> {
  const backendPath = path.join(appPath, 'amplify', 'backend.ts');
  console.log(`Fixing user pool region in GraphQL API config in ${backendPath}...`);

  let content: string;
  try {
    content = await fs.readFile(backendPath, 'utf-8');
  } catch {
    console.log('  backend.ts not found, skipping');
    return;
  }

  const updated = content.replace(
    /userPoolConfig:\s*\{\s*userPoolId:\s*backend\.auth\.resources\.userPool\.userPoolId,?\s*\}/g,
    `userPoolConfig: {
      userPoolId: backend.auth.resources.userPool.userPoolId,
      awsRegion: backend.auth.stack.region,
    }`,
  );

  if (updated === content) {
    console.log('  No userPoolConfig found to fix, skipping');
    return;
  }

  await fs.writeFile(backendPath, updated, 'utf-8');
  console.log('  Added awsRegion to userPoolConfig');
}

async function updateFrontendConfig(appPath: string): Promise<void> {
  const mainPath = path.join(appPath, 'src', 'main.tsx');
  console.log(`Updating frontend config import in ${mainPath}...`);

  let content: string;
  try {
    content = await fs.readFile(mainPath, 'utf-8');
  } catch {
    console.log('  main.tsx not found, skipping');
    return;
  }

  const updated = content.replace(
    /from\s*["']\.\/amplifyconfiguration\.json["']/g,
    "from '../amplify_outputs.json'",
  );

  if (updated === content) {
    console.log('  No amplifyconfiguration.json import found, skipping');
    return;
  }

  await fs.writeFile(mainPath, updated, 'utf-8');
  console.log('  Updated import to amplify_outputs.json');
}

export async function postGenerate(options: PostGenerateOptions): Promise<void> {
  const { appPath } = options;

  console.log(`Running post-generate for product-catalog at ${appPath}`);
  console.log('');

  await updateBranchName(appPath);
  await addAppsyncPolicyToBackend(appPath);
  await fixUserPoolRegionInGraphqlApi(appPath);
  await convertLowstockproductsToESM(appPath);
  await updateLowstockproductsResource(appPath);
  await convertS3TriggerToESM(appPath);
  await updateFrontendConfig(appPath);

  console.log('');
  console.log('Post-generate completed');
}

// CLI entry point
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const appPath = process.argv[2] || process.cwd();
  const envName = process.argv[3] || 'main';

  postGenerate({ appPath, envName }).catch((error) => {
    console.error('Post-generate failed:', error);
    process.exit(1);
  });
}
