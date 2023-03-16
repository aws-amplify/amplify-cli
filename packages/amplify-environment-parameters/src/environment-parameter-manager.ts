import { AmplifyError, AmplifyFault, IAmplifyResource, pathManager, stateManager } from '@aws-amplify/amplify-cli-core';
import _ from 'lodash';
import { getParametersControllerInstance, IBackendParametersController } from './backend-config-parameters-controller';
import { ResourceParameterManager } from './resource-parameter-manager';

const envParamManagerMap: Record<string, IEnvironmentParameterManager> = {};

/**
 * Returns singleton instance of param manager for the given environment, or initializes one if it doesn't exist
 */
export const ensureEnvParamManager = async (
  envName: string = stateManager.getLocalEnvInfo().envName,
): Promise<{ instance: IEnvironmentParameterManager }> => {
  if (!envParamManagerMap[envName]) {
    const envManager = new EnvironmentParameterManager(envName, getParametersControllerInstance());
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
export const getEnvParamManager = (envName: string = stateManager.getLocalEnvInfo().envName): IEnvironmentParameterManager => {
  if (envParamManagerMap[envName]) {
    return envParamManagerMap[envName];
  }
  throw new AmplifyFault('ProjectInitFault', {
    message: `EnvironmentParameterManager for ${envName} environment is not initialized.`,
  });
};

/**
 * Execute the save method of all currently initialized IEnvironmentParameterManager instances
 */
export const saveAll = async (serviceUploadHandler?: ServiceUploadHandler): Promise<void> => {
  for (const envParamManager of Object.values(envParamManagerMap)) {
    // save methods must be executed in sequence to avoid race conditions writing to the tpi file
    await envParamManager.save(serviceUploadHandler);
  }
};

/**
 * Class for interfacing with environment-specific parameters
 */
class EnvironmentParameterManager implements IEnvironmentParameterManager {
  private resourceParamManagers: Record<string, ResourceParameterManager> = {};
  constructor(private readonly envName: string, private readonly parameterMapController: IBackendParametersController) {}
  /**
   * For now this method is synchronous but it will eventually be async and load params from the service.
   * This is why it's not part of the class constructor
   */
  async init(): Promise<void> {
    // read in the TPI contents
    const categories = stateManager.getTeamProviderInfo(undefined, { throwIfNotExist: false })?.[this.envName]?.categories || {};
    Object.entries(categories as Record<string, unknown>).forEach(([category, resources]) => {
      Object.entries(resources as Record<string, Record<string, string>>).forEach(([resource, parameters]) => {
        this.getResourceParamManager(category, resource).setAllParams(parameters);
      });
    });
  }

  removeResourceParamManager(category: string, resource: string): void {
    delete this.resourceParamManagers[getResourceKey(category, resource)];
  }

  getResourceParamManager(category: string, resource: string): ResourceParameterManager {
    if (!category || !resource) {
      throw new AmplifyFault('ResourceNotFoundFault', {
        message: 'Missing Category or Resource.',
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

  async cloneEnvParamsToNewEnvParamManager(destManager: IEnvironmentParameterManager): Promise<void> {
    const resourceKeys = Object.keys(this.resourceParamManagers);
    const categoryResourceNamePairs: string[][] = resourceKeys.map((key) => key.split('_'));
    categoryResourceNamePairs.forEach(([category, resourceName]) => {
      const srcResourceParamManager: ResourceParameterManager = this.getResourceParamManager(category, resourceName);
      const allSrcParams: Record<string, string> = srcResourceParamManager.getAllParams();
      const destResourceParamManager: ResourceParameterManager = destManager.getResourceParamManager(category, resourceName);
      destResourceParamManager.setAllParams(allSrcParams);
    });
    await destManager.save();
  }

  async save(serviceUploadHandler?: ServiceUploadHandler): Promise<void> {
    if (!pathManager.findProjectRoot()) {
      // assume that the project is deleted if we cannot find a project root
      return;
    }
    const tpiContent = stateManager.getTeamProviderInfo(undefined, { throwIfNotExist: false, default: {} });
    const categoriesContent = this.serializeTPICategories();
    if (Object.keys(categoriesContent).length === 0) {
      delete tpiContent?.[this.envName]?.categories;
    } else {
      if (!tpiContent[this.envName]) {
        tpiContent[this.envName] = {};
      }
      tpiContent[this.envName].categories = this.serializeTPICategories();
    }
    stateManager.setTeamProviderInfo(undefined, tpiContent);

    // if this env manager is not for the currently checked out env, don't need to do anything else
    if (this.envName !== stateManager.getLocalEnvInfo().envName) {
      return;
    }

    // update param mapping
    this.parameterMapController.removeAllParameters();
    for (const [resourceKey, paramManager] of Object.entries(this.resourceParamManagers)) {
      const [category, resourceName] = splitResourceKey(resourceKey);
      const resourceParams = paramManager.getAllParams();
      for (const [paramName, paramValue] of Object.entries(resourceParams)) {
        const ssmParamName = getParameterStoreKey(category, resourceName, paramName);
        this.parameterMapController.addParameter(ssmParamName, [{ category, resourceName }]);
        if (serviceUploadHandler) {
          await serviceUploadHandler(ssmParamName, paramValue);
        }
      }
    }

    await this.parameterMapController.save();
  }

  async downloadParameters(downloadHandler: ServiceDownloadHandler): Promise<void> {
    const missingParameters = (await this.getMissingParameters()).map(({ categoryName, resourceName, parameterName }) =>
      getParameterStoreKey(categoryName, resourceName, parameterName),
    );
    const params = await downloadHandler(missingParameters);
    Object.entries(params).forEach(([key, value]) => {
      const [categoryName, resourceName, parameterName] = getNamesFromParameterStoreKey(key);
      const resourceParamManager = this.getResourceParamManager(categoryName, resourceName);
      resourceParamManager.setParam(parameterName, value as string); // TODO remove need for type assertion
    });
  }

  async getMissingParameters(resourceFilterList?: IAmplifyResource[]): Promise<ResourceParameter[]> {
    const expectedParameters = this.parameterMapController.getParameters();
    const allEnvParams = new Set();
    const missingResourceParameters: ResourceParameter[] = [];

    for (const [resourceKey, paramManager] of Object.entries(this.resourceParamManagers)) {
      const resourceParams = paramManager.getAllParams();
      for (const paramName of Object.keys(resourceParams)) {
        allEnvParams.add(`${resourceKey}_${paramName}`);
      }
    }

    Object.keys(expectedParameters).forEach((expectedParameter) => {
      const [categoryName, resourceName, parameterName] = getNamesFromParameterStoreKey(expectedParameter);
      if (
        resourceFilterList &&
        !resourceFilterList.some(({ category, resourceName: resource }) => categoryName === category && resource === resourceName)
      ) {
        return;
      }
      if (!allEnvParams.has(`${categoryName}_${resourceName}_${parameterName}`)) {
        missingResourceParameters.push({ categoryName, resourceName, parameterName });
      }
    });

    return missingResourceParameters;
  }

  /**
   * Throw an error if expected parameters are missing
   */
  async verifyExpectedEnvParameters(resourceFilterList?: IAmplifyResource[]): Promise<void> {
    const missingParameterNames = await this.getMissingParameters(resourceFilterList);

    if (missingParameterNames.length > 0) {
      throw new AmplifyError('MissingExpectedParameterError', {
        message: `Expected parameter${missingParameterNames.length === 1 ? '' : 's'} ${missingParameterNames.join(', ')}`,
      });
    }
  }

  private serializeTPICategories(): Record<string, unknown> {
    return Object.entries(this.resourceParamManagers).reduce((acc, [resourceKey, resourceParams]) => {
      _.setWith(acc, splitResourceKey(resourceKey), resourceParams.getAllParams(), Object);
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
  cloneEnvParamsToNewEnvParamManager: (destManager: IEnvironmentParameterManager) => Promise<void>;
  downloadParameters: (downloadHandler: ServiceDownloadHandler) => Promise<void>;
  getMissingParameters: (
    resourceFilterList?: IAmplifyResource[],
  ) => Promise<{ categoryName: string; resourceName: string; parameterName: string }[]>;
  getResourceParamManager: (category: string, resource: string) => ResourceParameterManager;
  hasResourceParamManager: (category: string, resource: string) => boolean;
  init: () => Promise<void>;
  removeResourceParamManager: (category: string, resource: string) => void;
  save: (serviceUploadHandler?: ServiceUploadHandler) => Promise<void>;
  verifyExpectedEnvParameters: (resourceFilterList?: IAmplifyResource[]) => Promise<void>;
};

export type ServiceUploadHandler = (key: string, value: string | number | boolean) => Promise<void>;
export type ServiceDownloadHandler = (parameters: string[]) => Promise<Record<string, string | number | boolean>>;

const getParameterStoreKey = (categoryName: string, resourceName: string, paramName: string): string =>
  `AMPLIFY_${categoryName}_${resourceName}_${paramName}`;

const getNamesFromParameterStoreKey = (fullParameter: string) => {
  const [, categoryName, resourceName] = fullParameter.split('_'); // Ignores the AMPLIFY prefix
  const parameterName = fullParameter.split('_').slice(3).join('_'); // In case parameterName contains underscores
  return [categoryName, resourceName, parameterName];
};

type ResourceParameter = {
  categoryName: string;
  resourceName: string;
  parameterName: string;
};
