import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs-extra';
import _ from 'lodash';
import { JSONUtilities } from 'amplify-cli-core';

function getAWSConfigAndroidPath(projRoot: string): string {
  return path.join(projRoot, 'app', 'src', 'main', 'res', 'raw', 'awsconfiguration.json');
}

function getAmplifyConfigAndroidPath(projRoot: string): string {
  return path.join(projRoot, 'app', 'src', 'main', 'res', 'raw', 'amplifyconfiguration.json');
}

function getAmplifyConfigIOSPath(projRoot: string): string {
  return path.join(projRoot, 'amplifyconfiguration.json');
}

function getAmplifyDirPath(projRoot: string): string {
  return path.join(projRoot, 'amplify');
}

function getAWSConfigIOSPath(projRoot: string): string {
  return path.join(projRoot, 'awsconfiguration.json');
}

function getProjectMeta(projectRoot: string) {
  const metaFilePath: string = path.join(projectRoot, 'amplify', '#current-cloud-backend', 'amplify-meta.json');
  return JSON.parse(fs.readFileSync(metaFilePath, 'utf8'));
}

function getProjectTags(projectRoot: string) {
  const projectTagsFilePath: string = path.join(projectRoot, 'amplify', '#current-cloud-backend', 'tags.json');
  return JSON.parse(fs.readFileSync(projectTagsFilePath, 'utf8'));
}

function getBackendAmplifyMeta(projectRoot: string) {
  const metaFilePath: string = path.join(projectRoot, 'amplify', 'backend', 'amplify-meta.json');
  return JSON.parse(fs.readFileSync(metaFilePath, 'utf8'));
}

function getBackendConfig(projectRoot: string) {
  const backendFConfigFilePath: string = path.join(projectRoot, 'amplify', 'backend', 'backend-config.json');
  return JSON.parse(fs.readFileSync(backendFConfigFilePath, 'utf8'));
}

function getLocalEnvInfo(projectRoot: string) {
  const localEnvInfoFilePath: string = path.join(projectRoot, 'amplify', '.config', 'local-env-info.json');
  return JSON.parse(fs.readFileSync(localEnvInfoFilePath, 'utf8'));
}

function getProjectConfig(projectRoot: string) {
  const projectConfigDir = path.join(projectRoot, 'amplify', '.config', 'project-config.json');
  return JSONUtilities.readJson<any>(projectConfigDir);
}

function getCloudBackendConfig(projectRoot: string) {
  const currentCloudPath: string = path.join(projectRoot, 'amplify', '#current-cloud-backend', 'backend-config.json');
  return JSON.parse(fs.readFileSync(currentCloudPath, 'utf8'));
}

function getParameterPath(projRoot: string, category: string, resourceName: string) {
  return path.join(projRoot, 'amplify', 'backend', category, resourceName, 'parameters.json');
}

function getTeamProviderInfo(projectRoot: string) {
  const teamProviderFilePath: string = path.join(projectRoot, 'amplify', 'team-provider-info.json');
  return JSON.parse(fs.readFileSync(teamProviderFilePath, 'utf8'));
}

function getS3StorageBucketName(projectRoot: string) {
  const meta = getProjectMeta(projectRoot);
  const storage = meta['storage'];
  const s3 = Object.keys(storage).filter(r => storage[r].service === 'S3');
  const fStorageName = s3[0];
  return storage[fStorageName].output.BucketName;
}

function getAwsAndroidConfig(projectRoot: string): any {
  const configPath = getAWSConfigAndroidPath(projectRoot);
  return JSONUtilities.readJson(configPath);
}

function getAwsIOSConfig(projectRoot: string): any {
  const configPath = getAWSConfigIOSPath(projectRoot);
  return JSONUtilities.readJson(configPath);
}

function getAmplifyIOSConfig(projectRoot: string): any {
  const configPath = getAmplifyConfigIOSPath(projectRoot);
  return JSONUtilities.readJson(configPath);
}

function getDeploymentSecrets(): any {
  const deploymentSecretsPath: string = path.join(os.homedir(), '.aws', 'amplify', 'deployment-secrets.json');
  return (
    JSONUtilities.readJson(deploymentSecretsPath, {
      throwIfNotExist: false,
    }) || { appSecrets: [] }
  );
}

function isDeploymentSecretForEnvExists(projRoot: string, envName: string): boolean {
  const teamproviderInfo = getTeamProviderInfo(projRoot);
  const rootStackId = teamproviderInfo[envName].awscloudformation.StackId.split('/')[2];
  const resource = _.first(Object.keys(teamproviderInfo[envName].categories.auth));
  const deploymentSecrets = getDeploymentSecrets();
  const deploymentSecretByAppId = _.find(deploymentSecrets.appSecrets, appSecret => appSecret.rootStackId === rootStackId);
  if (deploymentSecretByAppId) {
    const path = [envName, 'auth', resource, 'hostedUIProviderCreds'];
    return _.has(deploymentSecretByAppId.environments, path);
  }
  return false;
}

function getParameters(projRoot: string, category: string, resourceName: string): any {
  const parametersPath = getParameterPath(projRoot, category, resourceName);
  return JSONUtilities.parse(fs.readFileSync(parametersPath, 'utf8'));
}

function setParameters(projRoot: string, category: string, resourceName: string, parameters: any) {
  const parametersPath = getParameterPath(projRoot, category, resourceName);
  JSONUtilities.writeJson(parametersPath, parameters);
}

export {
  getProjectMeta,
  getProjectTags,
  getBackendAmplifyMeta,
  getAwsAndroidConfig,
  getAwsIOSConfig,
  getAmplifyIOSConfig,
  getAWSConfigAndroidPath,
  getAmplifyConfigAndroidPath,
  getAmplifyConfigIOSPath,
  getAWSConfigIOSPath,
  getDeploymentSecrets,
  isDeploymentSecretForEnvExists,
  getS3StorageBucketName,
  getAmplifyDirPath,
  getBackendConfig,
  getProjectConfig,
  getTeamProviderInfo,
  getParameters,
  getCloudBackendConfig,
  setParameters,
  getLocalEnvInfo,
};
