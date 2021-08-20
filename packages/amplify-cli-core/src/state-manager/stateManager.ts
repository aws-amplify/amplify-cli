import * as fs from 'fs-extra';
import * as path from 'path';
import _ from 'lodash';
import { $TSAny, $TSMeta, $TSTeamProviderInfo, DeploymentSecrets, HooksConfig, PathConstants } from '..';
import Ajv from "ajv";
import { pathManager } from './pathManager';
import { JSONUtilities } from '../jsonUtilities';
import { SecretFileMode } from '../cliConstants';
import { HydrateTags, ReadTags, Tag } from '../tags';
import { CustomIAMPolicies, CustomIAMPolicySchema, CustomIAMPoliciesSchema, CustomIAMPolicy } from '../customPoliciesType';
import { printer } from "amplify-prompts";

export type GetOptions<T> = {
  throwIfNotExist?: boolean;
  preserveComments?: boolean;
  default?: T;
};

export type ResourceEntry = {
  resourceName: string;
  resource: Record<string, object>;
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

    return this.getData<CustomIAMPolicies>(filePath, mergedOptions);
  };

  getCustomPolicies = (categoryName: string, resourceName: string): any => {
    const filePath = pathManager.getCustomPoliciesPath(categoryName, resourceName);
    let customPolicies: CustomIAMPolicies = {
      policies :  []
    }
    const data = JSONUtilities.readJson<CustomIAMPolicies>(filePath, {throwIfNotExist : false});
    const ajv = new Ajv();
    const { envName } = this.getLocalEnvInfo()

    //validate if the policies match the custom IAM policies schema, if not, then not write into the CFN template
    const validatePolicies = ajv.compile(CustomIAMPoliciesSchema);
    if (!data || !validatePolicies(data)) {
      printer.warn(`The format of custom IAM policies in the ${categoryName} ${resourceName} is not valid`);
      return undefined;
    }
    const validatePolicy = ajv.compile(CustomIAMPolicySchema);
    for (const policy of data.policies) {
      if (validatePolicy(policy)) {
        if (!policy.Effect) policy.Effect = 'Allow';
        const policyWithoutEnv = this.replaceEnvForCustomPolicies(policy, envName);
        customPolicies.policies.push(policyWithoutEnv);
      }
      else {
        printer.warn(`The format of custom IAM policies in the ${categoryName} ${resourceName} is not valid`);
        return undefined;
      }
    }
    //the policies with env will be written to the custom policies file again
    JSONUtilities.writeJson(filePath, data);
    //the policies without env will be carried over and merge into the CFN template
    return customPolicies;
  };

  //replace or add env parameter in the front of the resource customers enter to the current env
  replaceEnvForCustomPolicies = (policy: CustomIAMPolicy, currentEnv: string): CustomIAMPolicy => {
    let action = policy.Action;
    let effect = policy.Effect;
    let resourceWithNoEnv = [];
    let resourceWithEnv = [];

    for (let resource of policy.Resource){
      const splitedResource = resource.split('/');
      //if there is no env in the resource customers entered, then just add the current env to the resource
      if(splitedResource.length <= 1) {
        resourceWithEnv.push(`${currentEnv}/${splitedResource[0]}`);
        resourceWithNoEnv.push(splitedResource[0]);
        continue;
      }
      //In case there is a slash in the env name, check where is the start of the ARN
      let index = 0;
      for (index; index < splitedResource.length; index ++) {
        if (splitedResource[index].substring(0,3) === 'arn') {
          break;
        }
      }
      //change the env if env exists, or add the env if not exists.
      if (index >= 1) {
        let env = '';
        for (let i = 0; i < index; i++) {
          env = `${env}${splitedResource[i]}`;
          if (i < (index - 1)) env = `${env}/`
        }
        if (env != currentEnv) env = currentEnv;
        let combinedResourceWithEnv = env;
        for (let j = index; j < splitedResource.length; j++) {
          combinedResourceWithEnv = `${combinedResourceWithEnv}/${splitedResource[j]}`
        }
        resourceWithEnv.push(combinedResourceWithEnv);
        splitedResource[0] = '';
        resourceWithNoEnv.push(splitedResource.join(''));
      } else {
        resourceWithEnv.push(`${currentEnv}/${resource}`);
        resourceWithNoEnv.push(resource);
      }
    }
    //replace the original resource with the resource that have the current env
    policy.Resource = resourceWithEnv;
    const policyWithoutEnv: CustomIAMPolicy = {
      Action: action,
      Effect: effect,
      Resource: resourceWithNoEnv
    }
    //return the policies without the env to merge to CFN template
    return policyWithoutEnv;
  }

  addCustomPoliciesFile = (categoryName: string, resourceName: string): void => {
    const customPoliciesPath = pathManager.getCustomPoliciesPath(categoryName, resourceName);
    const defaultCustomPolicies = {
        policies: [
          {
            Effect: 'Allow',
            Action: [],
            Resource: []
          }
        ]
    }
    JSONUtilities.writeJson(customPoliciesPath, defaultCustomPolicies);
  }

  replaceEnvForCustomPoliciesBetweenEnv = (envName: string): void =>{
    const meta = this.getMeta();
    const categories = ['api', 'function'];
    const categoryObjects = [meta.api, meta.function];

    for (let i = 0; i < categories.length; i++) {
      const currentCategory = Object.keys(categoryObjects[i]);
      for (let j = 0; j < currentCategory.length; j++) {
        const resourceName = currentCategory[j];
        const customPoliciesPath = pathManager.getCustomPoliciesPath(categories[i], resourceName);
        const data = JSONUtilities.readJson<CustomIAMPolicies>(customPoliciesPath, {throwIfNotExist : false})
        if (!data) break;
        for (let policy of data.policies) {
          this.replaceEnvForCustomPolicies(policy, envName);
        }
        JSONUtilities.writeJson(customPoliciesPath, data);
      }
    }
  }

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

  getHooksConfigJson = (projectPath?: string): HooksConfig =>
    this.getData<HooksConfig>(pathManager.getHooksConfigFilePath(projectPath), { throwIfNotExist: false }) ?? {};

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

  getResourceFromMeta = (
    amplifyMeta: Record<string, any>,
    categoryName: string,
    serviceName: string,
    resourceName?: string | undefined,
    throwIfNotExist: boolean = true,
  ): ResourceEntry | null => {
    const resources = this.filterResourcesFromMeta(amplifyMeta, categoryName, serviceName, resourceName);

    if (resources.length == 0) {
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
    amplifyMeta: Record<string, any>,
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
