import * as fs from 'fs-extra';
import { getEnvInfo } from './get-env-info';
import { readJsonFile } from './read-json-file';
import { getProjectConfigFilePath, getAmplifyMetaFilePath, getProviderInfoFilePath } from './path-manager';

export function getProjectDetails() {
  const projectConfigFilePath = getProjectConfigFilePath();
  const projectConfig = readJsonFile(projectConfigFilePath);

  let amplifyMeta = {};
  const amplifyMetaFilePath = getAmplifyMetaFilePath();
  if (fs.existsSync(amplifyMetaFilePath)) {
    amplifyMeta = readJsonFile(amplifyMetaFilePath);
  }

  const localEnvInfo = getEnvInfo();

  let teamProviderInfo = {};
  const teamProviderFilePath = getProviderInfoFilePath();
  if (fs.existsSync(teamProviderFilePath)) {
    teamProviderInfo = readJsonFile(teamProviderFilePath);
  }

  return {
    projectConfig,
    amplifyMeta,
    localEnvInfo,
    teamProviderInfo,
  };
}
