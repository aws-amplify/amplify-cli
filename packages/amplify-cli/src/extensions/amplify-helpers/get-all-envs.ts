import * as fs from 'fs-extra';
import { readJsonFile } from './read-json-file';
import { getProviderInfoFilePath } from './path-manager';

export function getAllEnvs() {
  let allEnvs: string[] = [];
  const teamProviderInfoFilePath = getProviderInfoFilePath();
  if (fs.existsSync(teamProviderInfoFilePath)) {
    const envInfo = readJsonFile(teamProviderInfoFilePath);
    allEnvs = Object.keys(envInfo);
  }

  return allEnvs;
}
