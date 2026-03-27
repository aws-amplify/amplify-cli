#!/usr/bin/env npx ts-node
/**
 * Post-generate script for mood-board app.
 *
 * Applies manual edits required after `amplify gen2-migration generate`:
 * 1. Update branchName in amplify/data/resource.ts to "sandbox"
 * 2. Convert moodboardGetRandomEmoji function from CommonJS to ESM
 * 3. Convert moodboardKinesisReader function from CommonJS to ESM
 * 4. Remove hardcoded Kinesis ARN from moodboardKinesisReader environment
 * 5. Update frontend import from amplifyconfiguration.json to amplify_outputs.json
 * 6. Update SurpriseMeButton stream name to use gen2 prefix
 * 7. Add Kinesis IAM policy and environment variable to backend.ts
 * 8. Fix missing awsRegion in GraphQL API userPoolConfig
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

  let content: string;
  try {
    content = await fs.readFile(resourcePath, 'utf-8');
  } catch {
    console.log('  resource.ts not found, skipping');
    return;
  }

  // For sandbox deployments, Gen2 hardcodes the branch lookup to 'sandbox'
  const targetBranch = 'sandbox';

  const branchNameMatch = content.match(/branchName:\s*['"]([^'"]+)['"]/);
  if (branchNameMatch) {
    console.log(`  Found branchName: '${branchNameMatch[1]}'`);
  } else {
    console.log('  WARNING: No branchName property found');
    return;
  }

  const updated = content.replace(/branchName:\s*['"]([^'"]+)['"]/, `branchName: '${targetBranch}'`);

  if (updated === content) {
    console.log('  No branchName found to update, skipping');
    return;
  }

  await fs.writeFile(resourcePath, updated, 'utf-8');
  console.log(`  Updated branchName to "${targetBranch}"`);
}

async function convertFunctionToESM(appPath: string, functionName: string): Promise<void> {
  // Gen2 migration puts functions in amplify/function/ (singular)
  const handlerPath = path.join(appPath, 'amplify', 'function', functionName, 'index.js');

  console.log(`Converting ${functionName} to ESM in ${handlerPath}...`);

  let content: string;
  try {
    content = await fs.readFile(handlerPath, 'utf-8');
  } catch {
    console.log('  index.js not found, skipping');
    return;
  }

  // Convert exports.handler = async (event) => { to export async function handler(event) {
  let updated = content.replace(/exports\.handler\s*=\s*async\s*\((\w*)\)\s*=>\s*\{/g, 'export async function handler($1) {');

  // Also handle module.exports pattern
  updated = updated.replace(/module\.exports\.handler\s*=\s*async\s*\((\w*)\)\s*=>\s*\{/g, 'export async function handler($1) {');

  if (updated === content) {
    console.log('  No CommonJS exports found, skipping');
    return;
  }

  await fs.writeFile(handlerPath, updated, 'utf-8');
  console.log('  Converted to ESM syntax');
}

async function removeHardcodedKinesisArn(appPath: string): Promise<void> {
  const resourcePath = path.join(appPath, 'amplify', 'function', 'moodboardKinesisReader', 'resource.ts');

  console.log(`Removing hardcoded Kinesis ARN from ${resourcePath}...`);

  let content: string;
  try {
    content = await fs.readFile(resourcePath, 'utf-8');
  } catch {
    console.log('  resource.ts not found, skipping');
    return;
  }

  // Remove the hardcoded ANALYTICS_MOODBOARDKINESIS_KINESISSTREAMARN from environment
  // The line looks like: ANALYTICS_MOODBOARDKINESIS_KINESISSTREAMARN: "arn:aws:kinesis:..."
  const updated = content.replace(
    /,?\s*ANALYTICS_MOODBOARDKINESIS_KINESISSTREAMARN:\s*["'][^"']+["']/g,
    '',
  );

  if (updated === content) {
    console.log('  No hardcoded Kinesis ARN found, skipping');
    return;
  }

  await fs.writeFile(resourcePath, updated, 'utf-8');
  console.log('  Removed hardcoded Kinesis ARN');
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

  // Change: import amplifyconfig from './amplifyconfiguration.json';
  // To: import amplifyconfig from '../amplify_outputs.json';
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

async function updateSurpriseMeStreamName(appPath: string, envName: string): Promise<void> {
  const componentPath = path.join(appPath, 'src', 'components', 'SurpriseMeButton.tsx');

  console.log(`Updating stream name in ${componentPath}...`);

  let content: string;
  try {
    content = await fs.readFile(componentPath, 'utf-8');
  } catch {
    console.log('  SurpriseMeButton.tsx not found, skipping');
    return;
  }

  // During generate phase, update to gen2 prefix since Gen2 creates a new stream
  const gen2StreamName = `moodboardKinesis-gen2-${envName}`;
  const updated = content.replace(/const STREAM_NAME\s*=\s*['"][^'"]+['"]/, `const STREAM_NAME = '${gen2StreamName}'`);

  if (updated === content) {
    console.log('  No STREAM_NAME found to update, skipping');
    return;
  }

  await fs.writeFile(componentPath, updated, 'utf-8');
  console.log(`  Updated STREAM_NAME to "${gen2StreamName}"`);
}

async function addKinesisConfigToBackend(appPath: string): Promise<void> {
  const backendPath = path.join(appPath, 'amplify', 'backend.ts');

  console.log(`Adding Kinesis IAM policy and environment variable to ${backendPath}...`);

  let content: string;
  try {
    content = await fs.readFile(backendPath, 'utf-8');
  } catch {
    console.log('  backend.ts not found, skipping');
    return;
  }

  // Check if already added
  if (content.includes('kinesis:GetRecords')) {
    console.log('  Kinesis IAM policy already present, skipping');
    return;
  }

  // Add aws_iam import if not present
  if (!content.includes('aws_iam')) {
    content = content.replace(
      /import\s*\{\s*Duration\s*\}\s*from\s*["']aws-cdk-lib["']/,
      "import { Duration, aws_iam } from 'aws-cdk-lib'",
    );
  }

  // Add the Kinesis IAM policy and environment variable after the backend definition
  // Look for the last line that configures backend resources
  const kinesisConfig = `
// Grant Kinesis read permissions to moodboardKinesisReader
backend.moodboardKinesisReader.resources.lambda.addToRolePolicy(
  new aws_iam.PolicyStatement({
    actions: [
      'kinesis:ListShards',
      'kinesis:ListStreams',
      'kinesis:ListStreamConsumers',
      'kinesis:DescribeStream',
      'kinesis:DescribeStreamSummary',
      'kinesis:DescribeStreamConsumer',
      'kinesis:GetRecords',
      'kinesis:GetShardIterator',
      'kinesis:SubscribeToShard',
      'kinesis:DescribeLimits',
      'kinesis:ListTagsForStream',
    ],
    resources: [analytics.kinesisStreamArn],
  }),
);

// Add Kinesis stream ARN environment variable
backend.moodboardKinesisReader.addEnvironment('ANALYTICS_MOODBOARDKINESIS_KINESISSTREAMARN', analytics.kinesisStreamArn);
`;

  // Find a good insertion point - after the last backend configuration
  // Look for the export statement or end of file
  if (content.includes('export {')) {
    content = content.replace(/(\nexport\s*\{)/, `${kinesisConfig}\n$1`);
  } else {
    // Append to end of file
    content = content.trimEnd() + '\n' + kinesisConfig;
  }

  await fs.writeFile(backendPath, content, 'utf-8');
  console.log('  Added Kinesis IAM policy and environment variable');
}

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

  // The generated code sets additionalAuthenticationProviders with userPoolConfig
  // but is missing the awsRegion property. We need to add it.
  // Pattern: userPoolConfig: { userPoolId: backend.auth.resources.userPool.userPoolId, }
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

export async function postGenerate(options: PostGenerateOptions): Promise<void> {
  const { appPath, envName = 'sandbox' } = options;

  console.log(`Running post-generate for mood-board at ${appPath}`);
  console.log(`Using envName: ${envName}`);
  console.log('');

  await updateBranchName(appPath);
  await convertFunctionToESM(appPath, 'moodboardGetRandomEmoji');
  await convertFunctionToESM(appPath, 'moodboardKinesisReader');
  await removeHardcodedKinesisArn(appPath);
  await updateFrontendConfig(appPath);
  await updateSurpriseMeStreamName(appPath, envName);
  await addKinesisConfigToBackend(appPath);
  await fixUserPoolRegionInGraphqlApi(appPath);

  console.log('');
  console.log('Post-generate completed');
}

// CLI entry point
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const appPath = process.argv[2] || process.cwd();
  const envName = process.argv[3] || 'sandbox';

  postGenerate({ appPath, envName }).catch((error) => {
    console.error('Post-generate failed:', error);
    process.exit(1);
  });
}
