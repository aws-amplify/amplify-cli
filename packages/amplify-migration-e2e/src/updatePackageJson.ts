import { readJsonFile } from '@aws-amplify/amplify-e2e-core';
import * as fs from 'fs-extra';
import path from 'node:path';

export function updatePackageDependency(cwd: string, dependencyName: string, version: string) {
  const packageJsonPath = path.join(cwd, 'package.json');
  const packageJson = readJsonFile(packageJsonPath);

  packageJson.devDependencies = packageJson.devDependencies || {};
  packageJson.devDependencies[dependencyName] = version;

  const updatedContent = JSON.stringify(packageJson, null, 2);
  fs.writeFileSync(packageJsonPath, updatedContent, 'utf-8');
}
