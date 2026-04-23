#!/usr/bin/env npx ts-node
/**
 * Post-push script for mood-board app.
 *
 * Updates src/constants.ts so the Kinesis stream name matches the
 * deployed environment.
 */

import fs from 'fs/promises';
import path from 'path';

async function updateStreamNameConstant(appPath: string, envName: string): Promise<void> {
  const constantsPath = path.join(appPath, 'src', 'constants.ts');
  const content = await fs.readFile(constantsPath, 'utf-8');

  const updated = content.replace(
    /export const KINESIS_STREAM_NAME\s*=\s*['"][^'"]+['"]/,
    `export const KINESIS_STREAM_NAME = 'moodboardKinesis-${envName}'`,
  );

  await fs.writeFile(constantsPath, updated, 'utf-8');
}

export async function postPush(appPath: string, envName: string): Promise<void> {
  await updateStreamNameConstant(appPath, envName);
}

async function main(): Promise<void> {
  const [appPath = process.cwd()] = process.argv.slice(2);
  if (!process.env.GEN1_ENV_NAME) {
    throw new Error(`Missing GEN1_ENV_NAME env variable`);
  }
  await postPush(appPath, process.env.GEN1_ENV_NAME);
}

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
