#!/usr/bin/env npx ts-node
/**
 * Pre-push script for store-locator app.
 *
 * Sets the GROUP parameter for the PostConfirmation Lambda in
 * team-provider-info.json so that `amplify push --yes` doesn't prompt
 * for missing values and the Lambda adds confirmed users to the
 * storeLocatorAdmin group.
 */

import fs from 'fs';
import path from 'path';

function readEnvName(appPath: string): string {
  const tpiPath = path.join(appPath, 'amplify', 'team-provider-info.json');
  const tpi = JSON.parse(fs.readFileSync(tpiPath, 'utf-8'));
  return Object.keys(tpi)[0];
}

function setFunctionParameters(appPath: string, envName: string): void {
  const tpiPath = path.join(appPath, 'amplify', 'team-provider-info.json');
  const tpi = JSON.parse(fs.readFileSync(tpiPath, 'utf-8'));

  tpi[envName].categories ??= {};
  tpi[envName].categories.function ??= {};
  tpi[envName].categories.function.storelocator41a9495f41a9495fPostConfirmation = {
    ...tpi[envName].categories.function.storelocator41a9495f41a9495fPostConfirmation,
    GROUP: 'storeLocatorAdmin',
  };

  fs.writeFileSync(tpiPath, JSON.stringify(tpi, null, 2), 'utf-8');
}

function main(): void {
  const [appPath = process.cwd()] = process.argv.slice(2);
  const envName = readEnvName(appPath);
  setFunctionParameters(appPath, envName);
}

main();
