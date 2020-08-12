import { readJsonFile } from './read-json-file';
import { getProjectConfigFilePath } from './path-manager';

export function getProjectConfig() {
  const projectConfigFilePath = getProjectConfigFilePath();
  const projectConfig = readJsonFile(projectConfigFilePath);
  return projectConfig;
}
