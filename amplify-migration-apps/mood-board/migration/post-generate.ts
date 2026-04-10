#!/usr/bin/env npx ts-node
/**
 * Post-generate script for mood-board app.
 *
 * Applies manual edits required after `amplify gen2-migration generate`:
 * 1. Update branchName in amplify/data/resource.ts to the value of AWS_BRANCH
 *    env var, or the current git branch if AWS_BRANCH is not set
 * 2. Convert moodboardGetRandomEmoji function from CommonJS to ESM
 * 3. Convert moodboardKinesisReader function from CommonJS to ESM
 * 4. Remove hardcoded Kinesis ARN from moodboardKinesisReader environment
 * 5. Update frontend import from amplifyconfiguration.json to amplify_outputs.json
 * 6. Update SurpriseMeButton stream name to use gen2 prefix
 * 7. Add Kinesis IAM policy and environment variable to backend.ts
 */

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

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

async function convertFunctionToESM(appPath: string, functionName: string): Promise<void> {
  const handlerPath = path.join(appPath, 'amplify', 'function', functionName, 'index.js');

  const content = await fs.readFile(handlerPath, 'utf-8');

  let updated = content.replace(
    /exports\.handler\s*=\s*async\s*\((\w*)\)\s*=>\s*\{/g,
    'export async function handler($1) {',
  );

  updated = updated.replace(
    /module\.exports\.handler\s*=\s*async\s*\((\w*)\)\s*=>\s*\{/g,
    'export async function handler($1) {',
  );

  await fs.writeFile(handlerPath, updated, 'utf-8');
}

async function removeHardcodedKinesisArn(appPath: string): Promise<void> {
  const resourcePath = path.join(appPath, 'amplify', 'function', 'moodboardKinesisReader', 'resource.ts');

  const content = await fs.readFile(resourcePath, 'utf-8');

  const updated = content.replace(
    /,?\s*ANALYTICS_MOODBOARDKINESIS_KINESISSTREAMARN:\s*["'][^"']+["']/g,
    '',
  );

  await fs.writeFile(resourcePath, updated, 'utf-8');
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

async function updateSurpriseMeStreamName(appPath: string, envName: string): Promise<void> {
  const constantsPath = path.join(appPath, 'src', 'constants.ts');

  const content = await fs.readFile(constantsPath, 'utf-8');

  const gen2StreamName = `moodboardKinesis-gen2-${envName}`;
  const updated = content.replace(
    /export const KINESIS_STREAM_NAME\s*=\s*['"][^'"]+['"]/,
    `export const KINESIS_STREAM_NAME = '${gen2StreamName}'`,
  );

  await fs.writeFile(constantsPath, updated, 'utf-8');
}

async function addKinesisConfigToBackend(appPath: string): Promise<void> {
  const backendPath = path.join(appPath, 'amplify', 'backend.ts');

  let content = await fs.readFile(backendPath, 'utf-8');

  if (content.includes('kinesis:GetRecords')) return;

  if (!content.includes('aws_iam')) {
    content = content.replace(
      /import\s*\{\s*Duration\s*\}\s*from\s*["']aws-cdk-lib["']/,
      "import { Duration, aws_iam } from 'aws-cdk-lib'",
    );
  }

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

  if (content.includes('export {')) {
    content = content.replace(/(\nexport\s*\{)/, `${kinesisConfig}\n$1`);
  } else {
    content = content.trimEnd() + '\n' + kinesisConfig;
  }

  await fs.writeFile(backendPath, content, 'utf-8');
}

export async function postGenerate(appPath: string, envName: string): Promise<void> {
  await updateBranchName(appPath);
  await convertFunctionToESM(appPath, 'moodboardGetRandomEmoji');
  await convertFunctionToESM(appPath, 'moodboardKinesisReader');
  await removeHardcodedKinesisArn(appPath);
  await updateFrontendConfig(appPath);
  await updateSurpriseMeStreamName(appPath, envName);
  await addKinesisConfigToBackend(appPath);
}

async function main(): Promise<void> {
  const [appPath = process.cwd()] = process.argv.slice(2);
  if (!process.env.ENV_NAME) {
    throw new Error(`Missing ENV_NAME env variable`);
  }
  await postGenerate(appPath, process.env.ENV_NAME);
}

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
