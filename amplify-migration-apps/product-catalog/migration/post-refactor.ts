#!/usr/bin/env npx ts-node
/**
 * Post-refactor script for product-catalog app.
 *
 * Applies manual edits required after `amplify gen2-migration refactor`:
 * 1. Uncomment s3Bucket.bucketName in amplify/backend.ts to sync with deployed template
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Uncomment the s3Bucket.bucketName line in backend.ts.
 *
 * The generate step produces a commented line like:
 *   // s3Bucket.bucketName = 'bucket-name-here';
 *
 * After refactor, we need to uncomment it to sync with the deployed template.
 */
async function uncommentS3BucketName(appPath: string): Promise<void> {
  const backendPath = path.join(appPath, 'amplify', 'backend.ts');
  const content = await fs.readFile(backendPath, 'utf-8');

  // Match commented bucket name line: // s3Bucket.bucketName = '...';
  const updated = content.replace(
    /\/\/\s*(s3Bucket\.bucketName\s*=\s*['"][^'"]+['"];?)/g,
    '$1',
  );

  await fs.writeFile(backendPath, updated, 'utf-8');
}

export async function postRefactor(appPath: string): Promise<void> {
  await uncommentS3BucketName(appPath);
}

async function main(): Promise<void> {
  const [appPath = process.cwd()] = process.argv.slice(2);
  await postRefactor(appPath)
}

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
