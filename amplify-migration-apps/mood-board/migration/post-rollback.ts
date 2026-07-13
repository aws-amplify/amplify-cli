#!/usr/bin/env npx ts-node
/**
 * Post-rollback script for mood-board app.
 *
 * Reverses the manual edits applied by post-refactor:
 * 1. Comment back the postRefactor() call in amplify/backend.ts
 * 2. Revert SurpriseMeButton stream name to the Gen2 name
 */

import fs from 'fs/promises';
import path from 'path';

async function commentPostRefactorCall(appPath: string): Promise<void> {
  const backendPath = path.join(appPath, 'amplify', 'backend.ts');
  let content = await fs.readFile(backendPath, 'utf-8');

  content = content.replace(/^(\s*)(postRefactor\(\);?)$/m, '$1// $2');

  await fs.writeFile(backendPath, content, 'utf-8');
}

async function revertSurpriseMeStreamName(appPath: string, envName: string): Promise<void> {
  const constantsPath = path.join(appPath, 'src', 'constants.ts');
  const content = await fs.readFile(constantsPath, 'utf-8');

  const gen2StreamName = `moodboardKinesis-gen2-${envName}`;
  const updated = content.replace(
    /export const KINESIS_STREAM_NAME\s*=\s*['"][^'"]+['"]/,
    `export const KINESIS_STREAM_NAME = '${gen2StreamName}'`,
  );

  await fs.writeFile(constantsPath, updated, 'utf-8');
}

export async function postRollback(appPath: string, envName: string): Promise<void> {
  await commentPostRefactorCall(appPath);
  await revertSurpriseMeStreamName(appPath, envName);
}

async function main(): Promise<void> {
  const [appPath = process.cwd()] = process.argv.slice(2);
  if (!process.env.GEN1_ENV_NAME) {
    throw new Error(`Missing GEN1_ENV_NAME env variable`);
  }
  await postRollback(appPath, process.env.GEN1_ENV_NAME);
}

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
