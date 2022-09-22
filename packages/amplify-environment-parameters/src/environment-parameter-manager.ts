import { AmplifyFault, pathManager, stateManager } from 'amplify-cli-core';
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
  throw new AmplifyFault('ProjectInitFault', {
    message: `EnvironmentParameterManager for ${envName} environment is not initialized.`,
    resolution: 'Use initEnvParamManager first to initialize it.',
  });
};

/**
 * Class for interfacing with environment-specific parameters
 */
class EnvironmentParameterManager implements IEnvironmentParameterManager {
  private resourceParamManagers: Record<string, ResourceParameterManager> = {};
  constructor(private readonly envName: string) {}
  /**
   * For now this method is synchronous but it will eventually be async and load params from the service.
   * This is why it's not part of the class constructor
   */
  async init(): Promise<void> {
    // read in the TPI contents
    const categories = stateManager.getTeamProviderInfo()?.[this.envName]?.categories || {};
    Object.entries(categories as Record<string, unknown>).forEach(([category, resources]) => {
      Object.entries(resources as Record<string, Record<string, string>>).forEach(([resource, parameters]) => {
        this.getResourceParamManager(category, resource).setAllParams(parameters);
      });
    });

    process.on('beforeExit', () => this.save());
  }

  removeResourceParamManager(category: string, resource: string): void {
    delete this.resourceParamManagers[getResourceKey(category, resource)];
  }

  getResourceParamManager(category: string, resource: string): ResourceParameterManager {
    if (!category || !resource) {
      throw new AmplifyFault('ResourceNotFoundFault', {
        message: 'Category and resource must be specified to getResourceParamManager.',
        resolution: 'You must provide a category and resource.',
      });
    }
    const resourceKey = getResourceKey(category, resource);
    if (!this.resourceParamManagers[resourceKey]) {
      this.resourceParamManagers[resourceKey] = new ResourceParameterManager();
    }
    return this.resourceParamManagers[resourceKey];
  }

  hasResourceParamManager(category: string, resource: string): boolean {
    return !!this.resourceParamManagers[getResourceKey(category, resource)];
  }

  save(): void {
    if (!pathManager.findProjectRoot()) {
      // assume that the project is deleted if we cannot find a project root
      return;
    }
    const tpiContent = stateManager.getTeamProviderInfo();
    const categoriesContent = this.serializeTPICategories();
    if (Object.keys(categoriesContent).length === 0) {
      delete tpiContent[this.envName].categories;
    } else {
      tpiContent[this.envName].categories = this.serializeTPICategories();
    }
    stateManager.setTeamProviderInfo(undefined, tpiContent);
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

/**
 * Interface for environment parameter managers
 */
export type IEnvironmentParameterManager = {
  init: () => Promise<void>;
  removeResourceParamManager: (category: string, resource: string) => void;
  hasResourceParamManager: (category: string, resource: string) => boolean;
  getResourceParamManager: (category: string, resource: string) => ResourceParameterManager;
  save: () => void;
}
