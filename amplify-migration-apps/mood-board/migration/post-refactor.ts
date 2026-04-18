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

async function uncommentKinesisStreamName(appPath: string, envName: string): Promise<void> {
  const resourcePath = path.join(appPath, 'amplify', 'analytics', 'resource.ts');

  const content = await fs.readFile(resourcePath, 'utf-8');

  const streamName = `moodboardKinesis-${envName}`;

  let updated = content.replace(
    /\/\/\s*\(analytics\.node\.findChild\(['"]KinesisStream['"]\)\s*as\s*CfnStream\)\.name\s*=\s*["'][^"']*["']/,
    `(analytics.node.findChild('KinesisStream') as CfnStream).name = "${streamName}"`,
  );

  if (updated === content) {
    if (content.includes('export const analytics')) {
      updated = content.replace(
        /(export const analytics[^;]+;)/,
        `$1\n(analytics.node.findChild('KinesisStream') as CfnStream).name = "${streamName}";`,
      );
    }
  }

  await fs.writeFile(resourcePath, updated, 'utf-8');
}

async function uncommentS3BucketName(appPath: string): Promise<void> {
  const backendPath = path.join(appPath, 'amplify', 'backend.ts');

  const content = await fs.readFile(backendPath, 'utf-8');

  const updated = content.replace(/\/\/\s*(s3Bucket\.bucketName\s*=\s*['"][^'"]+['"];?)/, '$1');

  await fs.writeFile(backendPath, updated, 'utf-8');
}

async function uncommentPostRefactorTag(appPath: string): Promise<void> {
  const backendPath = path.join(appPath, 'amplify', 'backend.ts');
  let content = await fs.readFile(backendPath, 'utf-8');

  content = content.replace(/\/\/\s*(import \{ Tags \} from 'aws-cdk-lib';)/, '$1');
  content = content.replace(
    /\/\/\s*(Tags\.of\(backend\.stack\)\.add\(['"]gen2-migration\/post-refactor['"],\s*['"]true['"]\);?)/,
    '$1',
  );

  await fs.writeFile(backendPath, content, 'utf-8');
}

export async function postRefactor(appPath: string, envName: string): Promise<void> {
  await uncommentKinesisStreamName(appPath, envName);
  await uncommentS3BucketName(appPath);
  await uncommentPostRefactorTag(appPath);
}

async function main(): Promise<void> {
  const [appPath = process.cwd()] = process.argv.slice(2);
  if (!process.env.GEN1_ENV_NAME) {
    throw new Error(`Missing GEN1_ENV_NAME env variable`);
  }
  await postRefactor(appPath, process.env.GEN1_ENV_NAME);
}

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
