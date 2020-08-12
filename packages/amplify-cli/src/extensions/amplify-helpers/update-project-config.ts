import * as fs from 'fs-extra';
import { getProjectConfigFilePath } from './path-manager';
import { readJsonFile } from './read-json-file';

export function updateProjectConfig(projectPath, label, data) {
  let projectConfig;
  const projectConfigFilePath = getProjectConfigFilePath(projectPath);
  if (fs.existsSync(projectConfigFilePath)) {
    projectConfig = readJsonFile(projectConfigFilePath);
  } else {
    projectConfig = {};
  }

  projectConfig[label] = data;

  const jsonString = JSON.stringify(projectConfig, null, 4);
  fs.writeFileSync(projectConfigFilePath, jsonString, 'utf8');
}
