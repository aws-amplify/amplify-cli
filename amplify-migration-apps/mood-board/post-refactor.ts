#!/usr/bin/env npx ts-node
/**
 * Post-refactor script for mood-board app.
 *
 * Applies manual edits required after `amplify gen2-migration refactor`:
 * 1. Uncomment the Kinesis stream name override in analytics/resource.ts
 * 2. Uncomment the S3 bucket name override in backend.ts
 * 3. Update SurpriseMeButton stream name back to original (without gen2 prefix)
 */

import fs from 'fs/promises';
import path from 'path';

interface PostRefactorOptions {
  appPath: string;
  envName?: string;
}

async function uncommentKinesisStreamName(appPath: string, envName: string): Promise<void> {
  const resourcePath = path.join(appPath, 'amplify', 'analytics', 'resource.ts');

  console.log(`Uncommenting Kinesis stream name in ${resourcePath}...`);

  let content: string;
  try {
    content = await fs.readFile(resourcePath, 'utf-8');
  } catch {
    console.log('  analytics/resource.ts not found, skipping');
    return;
  }

  // The generated code has a commented line like:
  // //(analytics.node.findChild('KinesisStream') as CfnStream).name = "..."
  // We need to uncomment it and set the correct stream name
  const streamName = `moodboardKinesis-${envName}`;

  // First try to find and uncomment the existing line
  let updated = content.replace(
    /\/\/\s*\(analytics\.node\.findChild\(['"]KinesisStream['"]\)\s*as\s*CfnStream\)\.name\s*=\s*["'][^"']*["']/,
    `(analytics.node.findChild('KinesisStream') as CfnStream).name = "${streamName}"`,
  );

  if (updated === content) {
    // If no commented line found, try to add it after the analytics definition
    console.log('  No commented Kinesis stream name found, trying to add it');

    // Look for the analytics export and add the name override after it
    if (content.includes('export const analytics')) {
      updated = content.replace(
        /(export const analytics[^;]+;)/,
        `$1\n(analytics.node.findChild('KinesisStream') as CfnStream).name = "${streamName}";`,
      );
    }
  }

  if (updated === content) {
    console.log('  Could not find place to add Kinesis stream name, skipping');
    return;
  }

  await fs.writeFile(resourcePath, updated, 'utf-8');
  console.log(`  Set Kinesis stream name to "${streamName}"`);
}

async function uncommentS3BucketName(appPath: string): Promise<void> {
  const backendPath = path.join(appPath, 'amplify', 'backend.ts');

  console.log(`Uncommenting S3 bucket name in ${backendPath}...`);

  let content: string;
  try {
    content = await fs.readFile(backendPath, 'utf-8');
  } catch {
    console.log('  backend.ts not found, skipping');
    return;
  }

  // The generated code has a commented line like:
  // // s3Bucket.bucketName = '...';
  // We need to uncomment it
  const updated = content.replace(/\/\/\s*(s3Bucket\.bucketName\s*=\s*['"][^'"]+['"];?)/, '$1');

  if (updated === content) {
    console.log('  No commented S3 bucket name found, skipping');
    return;
  }

  await fs.writeFile(backendPath, updated, 'utf-8');
  console.log('  Uncommented S3 bucket name');
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

  // After refactor, the stream name should be the original (without gen2 prefix)
  // because the Kinesis stream has been moved from Gen1 to Gen2
  const originalStreamName = `moodboardKinesis-${envName}`;
  const updated = content.replace(/const STREAM_NAME\s*=\s*['"][^'"]+['"]/, `const STREAM_NAME = '${originalStreamName}'`);

  if (updated === content) {
    console.log('  No STREAM_NAME found to update, skipping');
    return;
  }

  await fs.writeFile(componentPath, updated, 'utf-8');
  console.log(`  Updated STREAM_NAME to "${originalStreamName}"`);
}

export async function postRefactor(options: PostRefactorOptions): Promise<void> {
  const { appPath, envName = 'main' } = options;

  console.log(`Running post-refactor for mood-board at ${appPath}`);
  console.log(`Using envName: ${envName}`);
  console.log('');

  await uncommentKinesisStreamName(appPath, envName);
  await uncommentS3BucketName(appPath);
  await updateSurpriseMeStreamName(appPath, envName);

  console.log('');
  console.log('Post-refactor completed');
}

// CLI entry point
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const appPath = process.argv[2] || process.cwd();
  const envName = process.argv[3] || 'main';

  postRefactor({ appPath, envName }).catch((error) => {
    console.error('Post-refactor failed:', error);
    process.exit(1);
  });
}
