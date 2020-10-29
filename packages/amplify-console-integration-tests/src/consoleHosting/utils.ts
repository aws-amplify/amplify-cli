import * as fs from 'fs-extra';
import * as path from 'path';
import { spawnSync } from 'child_process';
import * as util from '../util';
import { readJsonFile } from 'amplify-e2e-core';

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

export function cleanHostingLocally(cwd: string, currEnv: string) {
  const hostingDirPath = path.join(cwd, 'amplify', 'backend', 'hosting');
  fs.removeSync(hostingDirPath);
  const currentHostingDirPath = path.join(cwd, 'amplify', '#current-cloud-backend', 'hosting');
  fs.removeSync(currentHostingDirPath);

  const teamProviderInfoFilePath = path.join(cwd, 'amplify', 'team-provider-info.json');
  const teamProviderInfo = readJsonFile(teamProviderInfoFilePath);
  if (teamProviderInfo[currEnv].categories && teamProviderInfo[currEnv].categories.hosting) {
    delete teamProviderInfo[currEnv].categories.hosting;
    fs.writeFileSync(teamProviderInfoFilePath, JSON.stringify(teamProviderInfo, null, 4));
  }

  const amplifyMetaFilePath = path.join(cwd, 'amplify', 'backend', 'amplify-meta.json');
  const amplifyMeta = readJsonFile(amplifyMetaFilePath);
  if (amplifyMeta.hosting) {
    delete amplifyMeta.hosting;
    fs.writeFileSync(amplifyMetaFilePath, JSON.stringify(amplifyMeta, null, 4));
  }

  const currentMetaFilePath = path.join(cwd, 'amplify', '#current-cloud-backend', 'amplify-meta.json');
  const currentAmplifyMeta = readJsonFile(currentMetaFilePath);
  if (currentAmplifyMeta.hosting) {
    delete currentAmplifyMeta.hosting;
    fs.writeFileSync(currentMetaFilePath, JSON.stringify(currentAmplifyMeta, null, 4));
  }

  const backendConfigFilePath = path.join(cwd, 'amplify', 'backend', 'backend-config.json');
  const backendConfig = readJsonFile(backendConfigFilePath);
  if (backendConfig.hosting) {
    delete backendConfig.hosting;
    fs.writeFileSync(backendConfigFilePath, JSON.stringify(backendConfig, null, 4));
  }

  const currentBackendConfigFilePath = path.join(cwd, 'amplify', '#current-cloud-backend', 'backend-config.json');
  const currentBackendConfig = readJsonFile(currentBackendConfigFilePath);
  if (currentBackendConfig.hosting) {
    delete currentBackendConfig.hosting;
    fs.writeFileSync(currentBackendConfigFilePath, JSON.stringify(currentBackendConfig, null, 4));
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

export async function createTestProject(): Promise<string> {
  const projRoot = await util.createNewProjectDir('console-hosting');
  const projectName = path.basename(projRoot);
  const projectDir = path.dirname(projRoot);

  spawnSync('npx', ['create-react-app', projectName], { cwd: projectDir });

  return projRoot;
}
