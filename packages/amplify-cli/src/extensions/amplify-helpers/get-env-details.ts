import * as fs from 'fs-extra';
import { readJsonFile } from './read-json-file';
import { getProviderInfoFilePath } from './path-manager';

export function getEnvDetails() {
  const envProviderFilePath = getProviderInfoFilePath();
  let envProviderInfo = {};
  if (fs.existsSync(envProviderFilePath)) {
    envProviderInfo = readJsonFile(envProviderFilePath);
  }

  return envProviderInfo;
}
