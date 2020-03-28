import * as fs from 'fs-extra';
import * as path from 'path';
import { spawnSync } from 'child_process';

import { HOSTING, RESOURCE, TYPE, TYPE_UNKNOWN, CATEGORIES, APPID, PROVIDER } from './constants';

export function loadTypeFromTeamProviderInfo(cwd: string, currEnv: string) {
  const teamProviderPath = path.join(cwd, 'amplify', 'team-provider-info.json');
  const content = readJsonFile(teamProviderPath);
  if (
    content &&
    content[currEnv] &&
    content[currEnv][CATEGORIES] &&
    content[currEnv][CATEGORIES][HOSTING] &&
    content[currEnv][CATEGORIES][HOSTING][RESOURCE] &&
    content[currEnv][CATEGORIES][HOSTING][RESOURCE][TYPE]
  ) {
    return content[currEnv][CATEGORIES][HOSTING][RESOURCE][TYPE];
  } else {
    return TYPE_UNKNOWN;
  }
}

export function loadAppIdFromTeamProviderInfo(cwd: string, currEnv: string) {
  const teamProviderPath = path.join(cwd, 'amplify', 'team-provider-info.json');
  const content = readJsonFile(teamProviderPath);
  console.log('content:*******');
  console.log(currEnv);
  if (content && content[currEnv] && content[currEnv][PROVIDER] && content[currEnv][PROVIDER][APPID]) {
    return content[currEnv][PROVIDER][APPID];
  } else {
    return TYPE_UNKNOWN;
  }
}

function readJsonFile(jsonFilePath: string, encoding = 'utf8') {
  return JSON.parse(fs.readFileSync(jsonFilePath, encoding));
}

export function createTestProject(): string {
  const projectName = `console-hosting-${Math.round(Math.random() * 100)}-test-${Math.round(Math.random() * 1000)}`;
  const projectDir = path.normalize(path.join(__dirname, '../../../..'));

  spawnSync('npx', ['create-react-app', projectName], { cwd: projectDir });

  return path.join(projectDir, projectName);
}
