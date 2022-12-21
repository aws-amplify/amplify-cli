/* eslint-disable no-restricted-syntax */
/* eslint-disable max-len */
/* eslint-disable import/no-cycle */
import * as fs from 'fs-extra';
import * as path from 'path';
import _ from 'lodash';
import { PathConstants, pathManager } from './pathManager';
import {
  $TSMeta, $TSTeamProviderInfo, $TSAny, DeploymentSecrets, HooksConfig, $TSObject,
} from '..';
import { JSONUtilities } from '../jsonUtilities';
import { SecretFileMode } from '../cliConstants';
import { HydrateTags, ReadTags, Tag } from '../tags';
import { CustomIAMPolicies } from '../customPoliciesUtils';

/**
 * Options available in config files
 */
export type GetOptions<T> = {
  throwIfNotExist?: boolean;
  preserveComments?: boolean;
  default?: T;
};

/**
 * Resource entry stored in configuration files.
 */
export type ResourceEntry = {
  resourceName: string;
  resource: Record<string, unknown>;
};

/**
 * Amplify configuration state manager
 */
export class StateManager {
  metaFileExists = (projectPath?: string): boolean => this.doesExist(pathManager.getAmplifyMetaFilePath, projectPath);

  getMeta = (projectPath?: string, options?: GetOptions<$TSMeta>): $TSMeta => {
    const filePath = pathManager.getAmplifyMetaFilePath(projectPath);
    const mergedOptions = {
      throwIfNotExist: true,
      ...options,
    };

    return this.getData<$TSMeta>(filePath, mergedOptions);
  };

  currentMetaFileExists = (projectPath?: string): boolean => this.doesExist(pathManager.getCurrentAmplifyMetaFilePath, projectPath);

  setDeploymentSecrets = (deploymentSecrets: DeploymentSecrets): void => {
    const deploymentSecretsPath = pathManager.getDeploymentSecrets();
    JSONUtilities.writeJson(deploymentSecretsPath, deploymentSecrets, { mode: SecretFileMode }); // set deployment secret file permissions to -rw-------
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

  getDeploymentSecrets = (): DeploymentSecrets => (
    JSONUtilities.readJson<DeploymentSecrets>(pathManager.getDeploymentSecrets(), {
      throwIfNotExist: false,
    }) || { appSecrets: [] }
  );

  getProjectTags = (projectPath?: string): Tag[] => ReadTags(pathManager.getTagFilePath(projectPath));

  getCurrentProjectTags = (projectPath?: string): Tag[] => ReadTags(pathManager.getCurrentTagFilePath(projectPath));

  /**
   * Whether or not the `team-provider-info.json` file exists
   *
   * @deprecated Use envParamManager from amplify-environment-parameters
   */
  teamProviderInfoExists = (projectPath?: string): boolean => this.doesExist(pathManager.getTeamProviderInfoFilePath, projectPath);

  /**
   * Returns the contents of the `team-provider-info.json` file
   *
   * @deprecated Use envParamManager from amplify-environment-parameters
   */
  getTeamProviderInfo = (projectPath?: string, options?: GetOptions<$TSTeamProviderInfo>): $TSTeamProviderInfo => {
    const filePath = pathManager.getTeamProviderInfoFilePath(projectPath);
    const mergedOptions = {
      throwIfNotExist: true,
      ...options,
    };

    return this.getData<$TSTeamProviderInfo>(filePath, mergedOptions);
  };

  getCustomPolicies = (categoryName: string, resourceName: string): CustomIAMPolicies => {
    const filePath = pathManager.getCustomPoliciesPath(categoryName, resourceName);
    return JSONUtilities.readJson<CustomIAMPolicies>(filePath, { throwIfNotExist: false }) || [];
  };

  getCurrentRegion = (projectPath?: string):string | undefined => this.getMeta(projectPath).providers.awscloudformation.Region;

  getCurrentEnvName = (projectPath?: string): string | undefined => this.getLocalEnvInfo(projectPath, { throwIfNotExist: false })?.envName;

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

  /**
   * Returns `backend-config.json` as an object
   *
   * includeParameters should only be used by the BackendConfigParameterMapController to get the parameters from backend-config.json
   */
  getBackendConfig = (projectPath?: string, options?: GetOptions<$TSAny>, includeParameters = false): $TSAny => {
    const filePath = pathManager.getBackendConfigFilePath(projectPath);
    const mergedOptions = {
      throwIfNotExist: true,
      ...options,
    };

    const data = this.getData<$TSAny>(filePath, mergedOptions);

    if (includeParameters) {
      return data;
    }
    // omit parameters
    return _.omit(data, 'parameters');
  };

  getCurrentBackendConfig = (projectPath?: string, options?: GetOptions<$TSAny>): $TSAny => {
    const filePath = pathManager.getCurrentBackendConfigFilePath(projectPath);
    const mergedOptions = {
      throwIfNotExist: true,
      ...options,
    };
    return this.getData<$TSAny>(filePath, mergedOptions);
  };

  getProjectName = (): string => {
    const { projectName } = this.getProjectConfig();
    return projectName;
  }

  getAppID = () : string => {
    const meta = stateManager.getMeta(undefined, { throwIfNotExist: false });
    const appId = meta?.providers?.awscloudformation?.AmplifyAppId;
    if (!appId) {
      throw new Error('Could not find an Amplify AppId in the amplify-meta.json file. Make sure your project is initialized in the cloud.');
    }
    return appId;
  }

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

  getResourceInputsJson = (
    projectPath: string | undefined,
    category: string,
    resourceName: string,
    options?: GetOptions<$TSAny>,
  ): $TSAny => {
    const filePath = pathManager.getResourceInputsJsonFilePath(projectPath, category, resourceName);
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

  getAmplifyAdminConfigEntry = (appId: string, options?: GetOptions<$TSAny>): $TSAny => {
    const mergedOptions = {
      throwIfNotExist: false,
      default: {},
      ...options,
    };
    const adminConfig = JSONUtilities.readJson<$TSAny>(pathManager.getAmplifyAdminConfigFilePath(), { throwIfNotExist: false }) ?? mergedOptions.default;

    return adminConfig[appId];
  };

  removeAmplifyAdminConfigEntry = (appId: string): void => {
    const adminConfig: $TSAny = JSONUtilities.readJson(pathManager.getAmplifyAdminConfigFilePath());
    delete adminConfig[appId];
    JSONUtilities.writeJson(pathManager.getAmplifyAdminConfigFilePath(), adminConfig, { secureFile: true });
  };

  setAmplifyAdminConfigEntry = (appId: string, config: $TSAny): void => {
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

  getHydratedTags = (projectPath?: string | undefined, skipProjEnv = false): Tag[] => {
    const tags = this.getProjectTags(projectPath);
    const { projectName } = this.getProjectConfig(projectPath);
    const { envName } = this.getLocalEnvInfo(projectPath);
    return HydrateTags(tags, { projectName, envName }, skipProjEnv);
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

    JSONUtilities.writeJson(filePath, backendConfig, { orderedKeys: true });
  };

  setCurrentBackendConfig = (projectPath: string | undefined, backendConfig: $TSAny): void => {
    const filePath = pathManager.getCurrentBackendConfigFilePath(projectPath);

    JSONUtilities.writeJson(filePath, backendConfig, { orderedKeys: true });
  };

  setMeta = (projectPath: string | undefined, meta: $TSMeta): void => {
    const filePath = pathManager.getAmplifyMetaFilePath(projectPath);

    JSONUtilities.writeJson(filePath, meta);
  };

  setCurrentMeta = (projectPath: string | undefined, meta: $TSMeta): void => {
    const filePath = pathManager.getCurrentAmplifyMetaFilePath(projectPath);

    JSONUtilities.writeJson(filePath, meta);
  };

  getHooksConfigJson = (projectPath?: string): HooksConfig => this.getData<HooksConfig>(pathManager.getHooksConfigFilePath(projectPath), { throwIfNotExist: false }) ?? {};

  setSampleHooksDir = (projectPath: string | undefined, sourceDirPath: string): void => {
    const targetDirPath = pathManager.getHooksDirPath(projectPath);
    // only create the hooks directory with sample hooks if the directory doesn't already exist
    if (!fs.existsSync(targetDirPath)) {
      fs.ensureDirSync(targetDirPath);
      fs.copySync(
        path.join(sourceDirPath, PathConstants.HooksShellSampleFileName),
        path.join(targetDirPath, PathConstants.HooksShellSampleFileName),
      );
      fs.copySync(
        path.join(sourceDirPath, PathConstants.HooksJsSampleFileName),
        path.join(targetDirPath, PathConstants.HooksJsSampleFileName),
      );
      fs.copySync(path.join(sourceDirPath, PathConstants.HooksReadmeFileName), path.join(targetDirPath, PathConstants.ReadMeFileName));
    }
  };

  setResourceParametersJson = (projectPath: string | undefined, category: string, resourceName: string, parameters: $TSAny): void => {
    const filePath = pathManager.getResourceParametersFilePath(projectPath, category, resourceName);

    JSONUtilities.writeJson(filePath, parameters);
  };

  setResourceInputsJson = (projectPath: string | undefined, category: string, resourceName: string, inputs: $TSObject): void => {
    const filePath = pathManager.getResourceInputsJsonFilePath(projectPath, category, resourceName);

    JSONUtilities.writeJson(filePath, inputs);
  };

  resourceInputsJsonExists = (projectPath: string | undefined, category: string, resourceName: string): boolean => {
    try {
      return fs.existsSync(pathManager.getResourceInputsJsonFilePath(projectPath, category, resourceName));
    } catch (e) {
      return false;
    }
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

  setCLIJSON = (projectPath: string, cliJSON: $TSAny, env?: string): void => {
    const filePath = pathManager.getCLIJSONFilePath(projectPath, env);

    JSONUtilities.writeJson(filePath, cliJSON);
  };

  getResourceFromMeta = (
    amplifyMeta: Record<string, $TSAny>,
    categoryName: string,
    serviceName: string,
    resourceName?: string | undefined,
    throwIfNotExist = true,
  ): ResourceEntry | null => {
    const resources = this.filterResourcesFromMeta(amplifyMeta, categoryName, serviceName, resourceName);

    if (resources.length === 0) {
      const withNamePart = resourceName ? `with name: ${resourceName} ` : '';

      if (throwIfNotExist) {
        throw new Error(`Resource for ${serviceName} service in ${categoryName} category, ${withNamePart}was not found.`);
      } else {
        return null;
      }
    } else if (resources.length > 1) {
      throw new Error(
        `${resources.length} resources were found for ${serviceName} service in ${categoryName} category, but expected only 1.`,
      );
    }

    return resources[0];
  };

  private filterResourcesFromMeta = (
    amplifyMeta: Record<string, $TSAny>,
    categoryName: string,
    serviceName: string,
    resourceName?: string,
  ): ResourceEntry[] => {
    const categoryResources = _.get(amplifyMeta, [categoryName]);

    if (!categoryResources) {
      return [];
    }

    const result: ResourceEntry[] = [];

    for (const resourceKey of Object.keys(categoryResources)) {
      if (categoryResources[resourceKey].service === serviceName && (!resourceName || (resourceName && resourceKey === resourceName))) {
        result.push({
          resourceName: resourceKey,
          resource: categoryResources[resourceKey],
        });

        // If we have a match and we had a resourceName parameter passed in
        // break out as same object key cannot exists within the same object
        if (resourceName && result.length === 1) {
          break;
        }
      }
    }

    return result;
  };

  private doesExist = (filePathGetter: (projPath?: string) => string, projectPath?: string): boolean => {
    let chkPath;
    try {
      // getting the file path can fail if we are not in a valid project
      chkPath = filePathGetter(projectPath);
    } catch (e) {
      return false;
    }
    return fs.existsSync(chkPath);
  };

  private getData = <T>(filePath: string, options?: GetOptions<T>): T | undefined => {
    const data = JSONUtilities.readJson<T>(filePath, {
      throwIfNotExist: options?.throwIfNotExist ?? true,
    });

    return data ?? options?.default;
  };
}

export const stateManager = new StateManager();
