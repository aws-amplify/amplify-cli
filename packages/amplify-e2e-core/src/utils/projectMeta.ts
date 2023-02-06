/* eslint-disable jsdoc/require-jsdoc */
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs-extra';
import _ from 'lodash';
import { JSONUtilities, $TSAny } from 'amplify-cli-core';

// eslint-disable-next-line spellcheck/spell-checker
export const getAWSConfigAndroidPath = (projectRoot: string): string => path.join(projectRoot, 'app', 'src', 'main', 'res', 'raw', 'awsconfiguration.json');

// eslint-disable-next-line spellcheck/spell-checker
export const getAmplifyConfigAndroidPath = (projectRoot: string): string => path.join(projectRoot, 'app', 'src', 'main', 'res', 'raw', 'amplifyconfiguration.json');

// eslint-disable-next-line spellcheck/spell-checker
export const getAmplifyConfigIOSPath = (projectRoot: string): string => path.join(projectRoot, 'amplifyconfiguration.json');

// eslint-disable-next-line spellcheck/spell-checker
export const getAmplifyConfigFlutterPath = (projectRoot: string): string => path.join(projectRoot, 'lib', 'amplifyconfiguration.dart');

export const getAmplifyDirPath = (projectRoot: string): string => path.join(projectRoot, 'amplify');

// eslint-disable-next-line spellcheck/spell-checker
export const getAWSConfigIOSPath = (projectRoot: string): string => path.join(projectRoot, 'awsconfiguration.json');

export const getProjectMeta = (projectRoot: string): $TSAny => {
  const metaFilePath: string = path.join(projectRoot, 'amplify', '#current-cloud-backend', 'amplify-meta.json');
  return JSON.parse(fs.readFileSync(metaFilePath, 'utf8'));
};

export const getCustomPoliciesPath = (projectRoot: string, category: string, resourceName: string): string => path.join(projectRoot, 'amplify', 'backend', category, resourceName, 'custom-policies.json');

export const getProjectTags = (projectRoot: string): $TSAny => {
  const projectTagsFilePath: string = path.join(projectRoot, 'amplify', '#current-cloud-backend', 'tags.json');
  return JSON.parse(fs.readFileSync(projectTagsFilePath, 'utf8'));
};

export const getBackendAmplifyMeta = (projectRoot: string): $TSAny => {
  const metaFilePath: string = path.join(projectRoot, 'amplify', 'backend', 'amplify-meta.json');
  return JSON.parse(fs.readFileSync(metaFilePath, 'utf8'));
};

export const getBackendConfig = (projectRoot: string): $TSAny => {
  const backendFConfigFilePath: string = path.join(projectRoot, 'amplify', 'backend', 'backend-config.json');
  return JSON.parse(fs.readFileSync(backendFConfigFilePath, 'utf8'));
};

export const getLocalEnvInfo = (projectRoot: string): $TSAny => {
  const localEnvInfoFilePath: string = path.join(projectRoot, 'amplify', '.config', 'local-env-info.json');
  return JSON.parse(fs.readFileSync(localEnvInfoFilePath, 'utf8'));
};

export const getProjectConfig = (projectRoot: string): $TSAny => {
  const projectConfigDir = path.join(projectRoot, 'amplify', '.config', 'project-config.json');
  return JSONUtilities.readJson<$TSAny>(projectConfigDir);
};

export const getCloudBackendConfig = (projectRoot: string): $TSAny => {
  const currentCloudPath: string = path.join(projectRoot, 'amplify', '#current-cloud-backend', 'backend-config.json');
  return JSON.parse(fs.readFileSync(currentCloudPath, 'utf8'));
};

export const getRootStackTemplate = (projectRoot: string): $TSAny => {
  const rootStackPath = path.join(projectRoot, 'amplify', 'backend', 'awscloudformation', 'build', 'root-cloudformation-stack.json');
  return JSON.parse(fs.readFileSync(rootStackPath, 'utf8'));
};

const getParameterPath = (projectRoot: string, category: string, resourceName: string): string => path.join(projectRoot, 'amplify', 'backend', category, resourceName, 'build', 'parameters.json');

const getCLIInputsPath = (projectRoot: string, category: string, resourceName: string): string => path.join(projectRoot, 'amplify', 'backend', category, resourceName, 'cli-inputs.json');

const getCategoryParameterPath = (projectRoot: string, category: string, resourceName: string): string => path.join(projectRoot, 'amplify', 'backend', category, resourceName, `${category}-parameters.json`);

export const getTeamProviderInfo = (projectRoot: string): $TSAny => {
  const teamProviderFilePath: string = path.join(projectRoot, 'amplify', 'team-provider-info.json');
  return JSON.parse(fs.readFileSync(teamProviderFilePath, 'utf8'));
};

export const setTeamProviderInfo = (projectRoot: string, content: unknown): void => {
  const teamProviderFilePath: string = path.join(projectRoot, 'amplify', 'team-provider-info.json');
  JSONUtilities.writeJson(teamProviderFilePath, content);
};

export const getS3StorageBucketName = (projectRoot: string): string => {
  const meta = getProjectMeta(projectRoot);
  const { storage } = meta;
  const s3 = Object.keys(storage).filter(r => storage[r].service === 'S3');
  const fStorageName = s3[0];
  return storage[fStorageName].output.BucketName;
};

export const getAwsAndroidConfig = (projectRoot: string): $TSAny => {
  const configPath = getAWSConfigAndroidPath(projectRoot);
  return JSONUtilities.readJson(configPath);
};

export const getAwsIOSConfig = (projectRoot: string): $TSAny => {
  const configPath = getAWSConfigIOSPath(projectRoot);
  return JSONUtilities.readJson(configPath);
};

export const getAmplifyIOSConfig = (projectRoot: string): $TSAny => {
  const configPath = getAmplifyConfigIOSPath(projectRoot);
  return JSONUtilities.readJson(configPath);
};

export const getAmplifyFlutterConfig = (projectRoot: string): $TSAny => {
  const configPath = getAmplifyConfigFlutterPath(projectRoot);
  const dartFile = fs.readFileSync(configPath);
  return JSON.parse(dartFile.toString().split(/'''/)[1]);
};

export const getDeploymentSecrets = (): $TSAny => {
  const deploymentSecretsPath: string = path.join(os.homedir(), '.aws', 'amplify', 'deployment-secrets.json');
  return (
    JSONUtilities.readJson(deploymentSecretsPath, {
      throwIfNotExist: false,
    }) || { appSecrets: [] }
  );
};

export const isDeploymentSecretForEnvExists = (projectRoot: string, envName: string): boolean => {
  const teamProviderInfo = getTeamProviderInfo(projectRoot);
  const rootStackId = teamProviderInfo[envName].awscloudformation.StackId.split('/')[2];
  const resource = _.first(Object.keys(teamProviderInfo[envName].categories.auth));
  const deploymentSecrets = getDeploymentSecrets();
  const deploymentSecretByAppId = _.find(deploymentSecrets.appSecrets, appSecret => appSecret.rootStackId === rootStackId);
  if (deploymentSecretByAppId) {
    const providerCredsPath = [envName, 'auth', resource, 'hostedUIProviderCreds'];
    return _.has(deploymentSecretByAppId.environments, providerCredsPath);
  }
  return false;
};

export const parametersExists = (
  projectRoot: string, category: string, resourceName: string,
): boolean => fs.existsSync(getParameterPath(projectRoot, category, resourceName));

export const getParameters = (projectRoot: string, category: string, resourceName: string): $TSAny => {
  const parametersPath = getParameterPath(projectRoot, category, resourceName);
  return JSONUtilities.parse(fs.readFileSync(parametersPath, 'utf8'));
};

export const getCloudFormationTemplate = (projectRoot: string, category: string, resourceName: string): $TSAny => {
  let templatePath = path.join(projectRoot, 'amplify', 'backend', category, resourceName, 'build', `${resourceName}-cloudformation-template.json`);
  if (!fs.existsSync(templatePath)) {
    templatePath = path.join(projectRoot, 'amplify', 'backend', category, resourceName, 'build', 'cloudformation-template.json');
  }
  if (!fs.existsSync(templatePath)) {
    templatePath = path.join(projectRoot, 'amplify', 'backend', category, resourceName, `${resourceName}-cloudformation-template.json`);
  }
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Unable to locate cloudformation template for ${category} ${resourceName}`);
  }
  return JSONUtilities.parse(fs.readFileSync(templatePath, 'utf8'));
};

export const setParameters = (projectRoot: string, category: string, resourceName: string, parameters: unknown): void => {
  const parametersPath = getParameterPath(projectRoot, category, resourceName);
  JSONUtilities.writeJson(parametersPath, parameters);
};

export const cliInputsExists = (
  projectRoot: string, category: string, resourceName: string,
): boolean => fs.existsSync(getCLIInputsPath(projectRoot, category, resourceName));

export const getCLIInputs = (projectRoot: string, category: string, resourceName: string): $TSAny => {
  const parametersPath = getCLIInputsPath(projectRoot, category, resourceName);
  return JSONUtilities.parse(fs.readFileSync(parametersPath, 'utf8'));
};

export const setCLIInputs = (projectRoot: string, category: string, resourceName: string, parameters: unknown): void => {
  const parametersPath = getCLIInputsPath(projectRoot, category, resourceName);
  JSONUtilities.writeJson(parametersPath, parameters);
};

export const getCategoryParameters = (projectRoot: string, category: string, resourceName: string): $TSAny => {
  const filePath = getCategoryParameterPath(projectRoot, category, resourceName);
  return JSONUtilities.parse(fs.readFileSync(filePath, 'utf8'));
};

export const setCategoryParameters = (projectRoot: string, category: string, resourceName: string, params: unknown): $TSAny => {
  const filePath = getCategoryParameterPath(projectRoot, category, resourceName);
  JSONUtilities.writeJson(filePath, params);
};
