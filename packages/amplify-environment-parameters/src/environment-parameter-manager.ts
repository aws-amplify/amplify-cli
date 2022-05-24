import { stateManager } from 'amplify-cli-core';
import _ from 'lodash';
import { ResourceParameterManager } from './resource-parameter-manager';

const envParamManagerMap: Record<string, EnvironmentParameterManager> = {};

/**
 * Returns singleton instance of param manager for the given environment, or initializes one if it doesn't exist
 */
export const ensureEnvParamManager = async (
  envName: string = stateManager.getLocalEnvInfo().envName,
): Promise<{instance: EnvironmentParameterManager}> => {
  if (!envParamManagerMap[envName]) {
    const envManager = new EnvironmentParameterManager(envName);
    await envManager.init();
    envParamManagerMap[envName] = envManager;
  }
  return {
    instance: envParamManagerMap[envName],
  };
};

/**
 * Returns the singleton instance of param manager for the given environment, or throws if it doesn't exist.
 * This function provides a way to get a reference to the parameter manager synchronously as long as it has previously been initialized
 */
export const getEnvParamManager = (envName: string = stateManager.getLocalEnvInfo().envName): EnvironmentParameterManager => {
  if (envParamManagerMap[envName]) {
    return envParamManagerMap[envName];
  }
  throw new Error(`EnvironmentParameterManager for ${envName} environment is not initialized. Use initEnvParamManager first to initialize it`);
};

/**
 * Class for interfacing with environment-specific parameters
 */
class EnvironmentParameterManager {
  private resourceParamManagers: Record<string, ResourceParameterManager> = {};
  constructor(private readonly envName: string) {}
  async init(): Promise<void> {
    // if no tpi file exists
    //    read parameter state from service API
    // else
    //    read parameter state from TPI file
    //    remove current env state from file

    // read in the TPI contents with status = SET so the values will be persisted to SSM on exit
    const { categories } = stateManager.getTeamProviderInfo()?.[this.envName];
    Object.entries(categories as Record<string, unknown>).forEach(([category, resources]) => {
      Object.entries(resources as Record<string, Record<string, string>>).forEach(([resource, parameters]) => {
        this.getResourceParamManager(category, resource).setAllParams(parameters);
      });
    });

    process.on('exit', () => {
      this.save();
    });
  }

  deleteResource(category: string, resource: string): void {
    delete this.resourceParamManagers[getResourceKey(category, resource)];
  }

  getResourceParamManager(category: string, resource: string): ResourceParameterManager {
    const resourceKey = getResourceKey(category, resource);
    if (!this.resourceParamManagers[resourceKey]) {
      this.resourceParamManagers[resourceKey] = new ResourceParameterManager();
    }
    return this.resourceParamManagers[resourceKey];
  }

  private save(): void {
    const tpiContent = stateManager.getTeamProviderInfo();
    tpiContent[this.envName].categories = this.serializeTPICategories();
    stateManager.setTeamProviderInfo(undefined, tpiContent);
    console.log(JSON.stringify(tpiContent, undefined, 2));
  }

  private serializeTPICategories(): Record<string, unknown> {
    return Object.entries(this.resourceParamManagers).reduce((acc, [resourceKey, resourceParams]) => {
      _.set(acc, splitResourceKey(resourceKey), resourceParams.getAllParams());
      return acc;
    }, {} as Record<string, unknown>);
  }
}

const getResourceKey = (category: string, resourceName: string): string => `${category}_${resourceName}`;

// split into [category, resourceName]
const splitResourceKey = (key: string): readonly [string, string] => {
  const [category, resourceName] = key.split('_');
  return [category, resourceName];
};
