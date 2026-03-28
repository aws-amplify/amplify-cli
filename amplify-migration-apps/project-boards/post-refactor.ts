#!/usr/bin/env npx ts-node
/**
 * Post-refactor script for project-boards app.
 *
 * Applies manual edits required after `amplify gen2-migration refactor`:
 * 1. Uncomment s3Bucket.bucketName in amplify/backend.ts to sync with deployed template
 */

import fs from 'fs/promises';
import path from 'path';

interface PostRefactorOptions {
  appPath: string;
  envName?: string;
}

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

  console.log(`Uncommenting s3Bucket.bucketName in ${backendPath}...`);

  let content: string;
  try {
    content = await fs.readFile(backendPath, 'utf-8');
  } catch {
    console.log('  backend.ts not found, skipping');
    return;
  }

  // Match commented bucket name line: // s3Bucket.bucketName = '...';
  const updated = content.replace(
    /\/\/\s*(s3Bucket\.bucketName\s*=\s*['"][^'"]+['"];?)/g,
    '$1',
  );

  if (updated === content) {
    console.log('  No commented s3Bucket.bucketName found, skipping');
    return;
  }

  await fs.writeFile(backendPath, updated, 'utf-8');
  console.log('  Uncommented s3Bucket.bucketName');
}

export async function postRefactor(options: PostRefactorOptions): Promise<void> {
  const { appPath } = options;

  console.log(`Running post-refactor for project-boards at ${appPath}`);
  console.log('');

  await uncommentS3BucketName(appPath);

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
