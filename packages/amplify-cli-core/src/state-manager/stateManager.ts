import * as fs from 'fs-extra';
import { pathManager } from './pathManager';
import { $TSMeta, $TSTeamProviderInfo, $TSAny, DeploymentSecrets } from '..';
import { JSONUtilities } from '../jsonUtilities';
import _ from 'lodash';
import { SecretFileMode } from '../cliConstants';
import { Tag, ReadTags, HydrateTags } from '../tags';

export type GetOptions<T> = {
  throwIfNotExist?: boolean;
  preserveComments?: boolean;
  default?: T;
};

export class StateManager {
  metaFileExists = (projectPath?: string): boolean => this.doesExist(pathManager.getAmplifyMetaFilePath, projectPath);

  getMeta = (projectPath?: string, options?: GetOptions<$TSMeta>): $TSMeta => {
    const filePath = pathManager.getAmplifyMetaFilePath(projectPath);
    const mergedOptions = {
      throwIfNotExist: true,
      ...options,
    };

    const data = this.getData<$TSMeta>(filePath, mergedOptions);

    return data;
  };

  currentMetaFileExists = (projectPath?: string): boolean => this.doesExist(pathManager.getCurrentAmplifyMetaFilePath, projectPath);

  setDeploymentSecrets = (deploymentSecrets: DeploymentSecrets): void => {
    const path = pathManager.getDeploymentSecrets();
    JSONUtilities.writeJson(path, deploymentSecrets, { mode: SecretFileMode }); //set deployment secret file permissions to -rw-------
  };

  getCurrentMeta = (projectPath?: string, options?: GetOptions<$TSMeta>): $TSMeta => {
    const filePath = pathManager.getCurrentAmplifyMetaFilePath(projectPath);
    const mergedOptions = {
      throwIfNotExist: true,
      ...options,
    };

    const data = this.getData<$TSMeta>(filePath, mergedOptions);

    return data;
  };

  getDeploymentSecrets = (): DeploymentSecrets => {
    return (
      JSONUtilities.readJson<DeploymentSecrets>(pathManager.getDeploymentSecrets(), {
        throwIfNotExist: false,
      }) || { appSecrets: [] }
    );
  };

  getProjectTags = (projectPath?: string): Tag[] => ReadTags(pathManager.getTagFilePath(projectPath));

  getCurrentProjectTags = (projectPath?: string): Tag[] => ReadTags(pathManager.getCurrentTagFilePath(projectPath));

  teamProviderInfoExists = (projectPath?: string): boolean => this.doesExist(pathManager.getTeamProviderInfoFilePath, projectPath);

  getTeamProviderInfo = (projectPath?: string, options?: GetOptions<$TSTeamProviderInfo>): $TSTeamProviderInfo => {
    const filePath = pathManager.getTeamProviderInfoFilePath(projectPath);
    const mergedOptions = {
      throwIfNotExist: true,
      ...options,
    };

    return this.getData<$TSTeamProviderInfo>(filePath, mergedOptions);
  };

  localEnvInfoExists = (projectPath?: string): boolean => this.doesExist(pathManager.getLocalEnvFilePath, projectPath);

  getLocalEnvInfo = (projectPath?: string, options?: GetOptions<$TSAny>): $TSAny => {
    const filePath = pathManager.getLocalEnvFilePath(projectPath);
    const mergedOptions = {
      throwIfNotExist: true,
      ...options,
    };

    return this.getData<$TSAny>(filePath, mergedOptions);
  };

  localAWSInfoExists = (projectPath?: string): boolean => this.doesExist(pathManager.getLocalAWSInfoFilePath, projectPath);

  getLocalAWSInfo = (projectPath?: string, options?: GetOptions<$TSAny>): $TSAny => {
    const filePath = pathManager.getLocalAWSInfoFilePath(projectPath);
    const mergedOptions = {
      throwIfNotExist: true,
      ...options,
    };

    return this.getData<$TSAny>(filePath, mergedOptions);
  };

  projectConfigExists = (projectPath?: string): boolean => this.doesExist(pathManager.getProjectConfigFilePath, projectPath);

  getProjectConfig = (projectPath?: string, options?: GetOptions<$TSAny>): $TSAny => {
    const filePath = pathManager.getProjectConfigFilePath(projectPath);
    const mergedOptions = {
      throwIfNotExist: true,
      ...options,
    };

    return this.getData<$TSAny>(filePath, mergedOptions);
  };

  backendConfigFileExists = (projectPath?: string): boolean => this.doesExist(pathManager.getBackendConfigFilePath, projectPath);

  getBackendConfig = (projectPath?: string, options?: GetOptions<$TSAny>): $TSAny => {
    const filePath = pathManager.getBackendConfigFilePath(projectPath);
    const mergedOptions = {
      throwIfNotExist: true,
      ...options,
    };

    return this.getData<$TSAny>(filePath, mergedOptions);
  };

  getResourceParametersJson = (
    projectPath: string | undefined,
    category: string,
    resourceName: string,
    options?: GetOptions<$TSAny>,
  ): $TSAny => {
    const filePath = pathManager.getResourceParametersFilePath(projectPath, category, resourceName);
    const mergedOptions = {
      throwIfNotExist: true,
      ...options,
    };

    return this.getData<$TSAny>(filePath, mergedOptions);
  };

  getCurrentResourceParametersJson = (
    projectPath: string | undefined,
    category: string,
    resourceName: string,
    options?: GetOptions<$TSAny>,
  ): $TSAny => {
    const filePath = pathManager.getCurrentResourceParametersJsonPath(projectPath, category, resourceName);
    const mergedOptions = {
      throwIfNotExist: true,
      ...options,
    };

    return this.getData<$TSAny>(filePath, mergedOptions);
  };

  getAmplifyAdminConfigEntry = (appId: string, options?: GetOptions<$TSAny>) => {
    const mergedOptions = {
      throwIfNotExist: false,
      default: {},
      ...options,
    };
    const adminConfig =
      JSONUtilities.readJson<$TSAny>(pathManager.getAmplifyAdminConfigFilePath(), { throwIfNotExist: false }) ?? mergedOptions.default;

    return adminConfig[appId];
  };

  removeAmplifyAdminConfigEntry = (appId: string) => {
    const adminConfig: $TSAny = JSONUtilities.readJson(pathManager.getAmplifyAdminConfigFilePath());
    delete adminConfig[appId];
    JSONUtilities.writeJson(pathManager.getAmplifyAdminConfigFilePath(), adminConfig, { secureFile: true });
  };

  setAmplifyAdminConfigEntry = (appId: string, config: $TSAny) => {
    const adminConfig: $TSAny = JSONUtilities.readJson(pathManager.getAmplifyAdminConfigFilePath(), { throwIfNotExist: false }) || {};
    adminConfig[appId] = config;
    JSONUtilities.writeJson(pathManager.getAmplifyAdminConfigFilePath(), adminConfig, { secureFile: true });
  };

  setLocalEnvInfo = (projectPath: string | undefined, localEnvInfo: $TSAny): void => {
    const filePath = pathManager.getLocalEnvFilePath(projectPath);

    JSONUtilities.writeJson(filePath, localEnvInfo);
  };

  setLocalAWSInfo = (projectPath: string | undefined, localAWSInfo: $TSAny): void => {
    const filePath = pathManager.getLocalAWSInfoFilePath(projectPath);

    JSONUtilities.writeJson(filePath, localAWSInfo);
  };

  getHydratedTags = (projectPath?: string | undefined): Tag[] => {
    const tags = this.getProjectTags(projectPath);
    const { projectName } = this.getProjectConfig(projectPath);
    const { envName } = this.getLocalEnvInfo(projectPath);
    return HydrateTags(tags, { projectName, envName });
  };

  isTagFilePresent = (projectPath?: string | undefined): boolean => {
    if (pathManager.findProjectRoot()) return fs.existsSync(pathManager.getTagFilePath(projectPath));
    return false;
  };

  setProjectFileTags = (projectPath: string | undefined, tags: Tag[]): void => {
    const tagFilePath = pathManager.getTagFilePath(projectPath);
    JSONUtilities.writeJson(tagFilePath, tags);
  };

  setProjectConfig = (projectPath: string | undefined, projectConfig: $TSAny): void => {
    const filePath = pathManager.getProjectConfigFilePath(projectPath);

    JSONUtilities.writeJson(filePath, projectConfig);
  };

  setTeamProviderInfo = (projectPath: string | undefined, teamProviderInfo: $TSTeamProviderInfo): void => {
    const filePath = pathManager.getTeamProviderInfoFilePath(projectPath);

    JSONUtilities.writeJson(filePath, teamProviderInfo);
  };

  setBackendConfig = (projectPath: string | undefined, backendConfig: $TSAny): void => {
    const filePath = pathManager.getBackendConfigFilePath(projectPath);

    JSONUtilities.writeJson(filePath, backendConfig);
  };

  setMeta = (projectPath: string | undefined, meta: $TSMeta): void => {
    const filePath = pathManager.getAmplifyMetaFilePath(projectPath);

    JSONUtilities.writeJson(filePath, meta);
  };

  setCurrentMeta = (projectPath: string | undefined, meta: $TSMeta): void => {
    const filePath = pathManager.getCurrentAmplifyMetaFilePath(projectPath);

    JSONUtilities.writeJson(filePath, meta);
  };

  setResourceParametersJson = (projectPath: string | undefined, category: string, resourceName: string, parameters: $TSAny): void => {
    const filePath = pathManager.getResourceParametersFilePath(projectPath, category, resourceName);

    JSONUtilities.writeJson(filePath, parameters);
  };

  cliJSONFileExists = (projectPath: string, env?: string): boolean => {
    try {
      return fs.existsSync(pathManager.getCLIJSONFilePath(projectPath, env));
    } catch (e) {
      return false;
    }
  };

  getCLIJSON = (projectPath: string, env?: string, options?: GetOptions<$TSAny>): $TSAny => {
    const filePath = pathManager.getCLIJSONFilePath(projectPath, env);
    const mergedOptions = {
      throwIfNotExist: true,
      ...options,
    };

    return this.getData<$TSAny>(filePath, mergedOptions);
  };

  setCLIJSON = (projectPath: string, cliJSON: any, env?: string): void => {
    const filePath = pathManager.getCLIJSONFilePath(projectPath, env);

    JSONUtilities.writeJson(filePath, cliJSON, {
      keepComments: true,
    });
  };

  private doesExist = (filePathGetter: (projPath?: string) => string, projectPath?: string): boolean => {
    let path;
    try {
      // getting the file path can fail if we are not in a valid project
      path = filePathGetter(projectPath);
    } catch (e) {
      return false;
    }
    return fs.existsSync(path);
  };

  private getData = <T>(filePath: string, options?: GetOptions<T>): T | undefined => {
    const data = JSONUtilities.readJson<T>(filePath, {
      throwIfNotExist: options?.throwIfNotExist ?? true,
    });

    return data ?? options?.default;
  };
}

export const stateManager = new StateManager();
