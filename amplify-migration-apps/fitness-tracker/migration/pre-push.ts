#!/usr/bin/env npx ts-node
/**
 * Pre-push script for fitness-tracker app.
 *
 * Sets the DOMAINALLOWLIST parameter for the PreSignup Lambda in
 * team-provider-info.json so that `amplify push --yes` doesn't prompt
 * for missing values and the Lambda allows test users from amazon.com.
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
  tpi[envName].categories.function.fitnesstracker33f5545533f55455PreSignup = {
    ...tpi[envName].categories.function.fitnesstracker33f5545533f55455PreSignup,
    DOMAINALLOWLIST: 'amazon.com',
  };

  fs.writeFileSync(tpiPath, JSON.stringify(tpi, null, 2), 'utf-8');
}

function main(): void {
  const [appPath = process.cwd()] = process.argv.slice(2);
  const envName = readEnvName(appPath);
  setFunctionParameters(appPath, envName);
}

main();
