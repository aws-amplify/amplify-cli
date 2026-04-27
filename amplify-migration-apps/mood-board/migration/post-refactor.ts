#!/usr/bin/env npx ts-node
/**
 * Post-refactor script for mood-board app.
 *
 * Applies manual edits required after `amplify gen2-migration refactor`:
 * 1. Uncomment the postRefactor() call in amplify/backend.ts
 * 2. Revert SurpriseMeButton stream name to the original Gen1 name
 */

import fs from 'fs/promises';
import path from 'path';

async function uncommentPostRefactorCall(appPath: string): Promise<void> {
  const backendPath = path.join(appPath, 'amplify', 'backend.ts');
  let content = await fs.readFile(backendPath, 'utf-8');

  content = content.replace(/\/\/\s*(postRefactor\(\);?)/, '$1');

  await fs.writeFile(backendPath, content, 'utf-8');
}

async function updateSurpriseMeStreamName(appPath: string, envName: string): Promise<void> {
  const constantsPath = path.join(appPath, 'src', 'constants.ts');
  const content = await fs.readFile(constantsPath, 'utf-8');

  const gen1StreamName = `moodboardKinesis-${envName}`;
  const updated = content.replace(
    /export const KINESIS_STREAM_NAME\s*=\s*['"][^'"]+['"]/,
    `export const KINESIS_STREAM_NAME = '${gen1StreamName}'`,
  );

  await fs.writeFile(constantsPath, updated, 'utf-8');
}

export async function postRefactor(appPath: string, envName: string): Promise<void> {
  await uncommentPostRefactorCall(appPath);
  await updateSurpriseMeStreamName(appPath, envName);
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
