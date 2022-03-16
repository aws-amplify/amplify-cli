import { JSONUtilities, pathManager, $TSObject, stateManager, $TSContext } from 'amplify-cli-core';
import { category, supportedRegions } from '../constants';
import path from 'path';
import _ from 'lodash';
import { BaseStack } from '../service-stacks/baseStack';
import { parametersFileName, ServiceName, provider } from './constants';
import { ResourceParameters, AccessType } from './resourceParams';
import os from 'os';
import { getMapIamPolicies } from './mapUtils';
import { getPlaceIndexIamPolicies } from './placeIndexUtils';
import { printer } from 'amplify-prompts';

// Merges other with existing in a non-destructive way.
// Specifically, scalar values will not be overwritten
// Objects will have field added but not removed or modified
// Arrays will be appended to, duplicates are removed
export function merge<T>(existing: Partial<T>, other?: Partial<T>): Partial<T> {
  const mergeFunc = (oldVal: any, newVal: any) => {
    if (!_.isObject(oldVal)) {
      return oldVal;
    }
    if (_.isArray(oldVal)) {
      return _.uniqWith(oldVal.concat(newVal), _.isEqual);
    }
  };
  if (!other) return existing;
  return _.mergeWith(existing, other, mergeFunc);
}

/**
 * Generates the CFN template for Geo resource
 */
export const generateTemplateFile = (stack: BaseStack, resourceName: string) => {
  const cfnFileName = `${resourceName}-cloudformation-template.json`;
  const resourceDir = path.join(pathManager.getBackendDirPath(), category, resourceName);
  JSONUtilities.writeJson(path.normalize(path.join(resourceDir, cfnFileName)), stack.toCloudFormation());
};

/**
 * Update the CFN input parameters for given Geo resource
 */
export const updateParametersFile = (
  parameters: $TSObject,
  resourceName: string,
  parametersFileName: string
) => {
  const parametersFilePath = path.join(pathManager.getBackendDirPath(), category, resourceName, parametersFileName);
  const currentParameters: $TSObject = JSONUtilities.readJson(parametersFilePath, { throwIfNotExist: false }) || {};
  JSONUtilities.writeJson(parametersFilePath, { ...currentParameters, ...parameters });
};

/**
 * Get the information stored in Amplify Meta for resources belonging to given type/service
 * @param service The type of the resource
 * @returns resource information available in Amplify Meta file
 */
export const getGeoServiceMeta = async (service: ServiceName): Promise<$TSObject> => _.pickBy(stateManager.getMeta()?.[category], (val) => val.service === service)

/**
 * Get the Geo resource configurations stored in Amplify Meta file
 */
export const readResourceMetaParameters = async (
  service: ServiceName,
  resourceName: string
): Promise<$TSObject> => {
  const serviceResources = await getGeoServiceMeta(service);
  const resourceMetaParameters = serviceResources?.[resourceName];
  if (!resourceMetaParameters) {
    throw new Error(`Error reading Meta Parameters for ${resourceName}`);
  }
  else return resourceMetaParameters;
};

/**
 * Update the default resource for given Geo service
 */
export const updateDefaultResource = async (
  context: $TSContext,
  service: ServiceName,
  defaultResource?: string
) => {
  const serviceResources = await getGeoServiceMeta(service);
  Object.keys(serviceResources).forEach(resource => {
    context.amplify.updateamplifyMetaAfterResourceUpdate(
      category,
      resource,
      'isDefault',
      (defaultResource === resource)
    );

    updateParametersFile(
      { isDefault: (defaultResource === resource) },
      resource,
      parametersFileName
    );
  });
};

/**
 * Check if any resource of given type exists
 */
export const geoServiceExists = async (service: ServiceName): Promise<boolean> => {
  const serviceMeta = await getGeoServiceMeta(service);
  return serviceMeta && Object.keys(serviceMeta).length > 0;
}

/**
 * Check and ensure if unauth access needs to be enabled for identity pool
 */
export const checkAuthConfig = async (context: $TSContext, parameters: Pick<ResourceParameters, 'name' | 'accessType'>, service: ServiceName) => {
  if (parameters.accessType === AccessType.AuthorizedAndGuestUsers) {
    const authRequirements = { authSelections: 'identityPoolOnly', allowUnauthenticatedIdentities: true };

    const checkResult: $TSObject = await context.amplify.invokePluginMethod(context, 'auth', undefined, 'checkRequirements', [
      authRequirements,
      context,
      category,
      parameters.name,
    ]);

    // If auth is not added, throw error
    if (!checkResult.authEnabled) {
      throw new Error(`Adding ${service} to your project requires the Auth category for managing authentication rules. Please add auth using "amplify add auth"`);
    }

    // If auth is imported and configured, we have to throw the error instead of printing since there is no way to adjust the auth
    // configuration.
    if (checkResult.authImported === true && checkResult.errors && checkResult.errors.length > 0) {
      throw new Error(checkResult.errors.join(os.EOL));
    }

    if (checkResult.errors && checkResult.errors.length > 0) {
      printer.warn(checkResult.errors.join(os.EOL));
    }

    // If auth is not imported and there were errors, adjust or enable auth configuration
    if (!checkResult.requirementsMet) {
      try {
        await context.amplify.invokePluginMethod(context, 'auth', undefined, 'externalAuthEnable', [
          context,
          category,
          service,
          authRequirements
        ]);
      } catch (error) {
        printer.error(error as string);
        throw error;
      }
    }
  }
}

/**
 * Check if the Geo resource already exists
 */
export const checkGeoResourceExists = async (resourceName: string): Promise<boolean> => {
  const geoMeta = stateManager.getMeta()?.[category];
  return geoMeta && Object.keys(geoMeta) && Object.keys(geoMeta).includes(resourceName);
}

/**
 * Get permission policies for Geo supported services
 */
export const getServicePermissionPolicies = (
  context: $TSContext,
  service: ServiceName,
  resourceName: string,
  crudOptions: string[]
): { policy:$TSObject[], attributes: string[] } => {
  switch (service) {
    case ServiceName.Map:
      return getMapIamPolicies(resourceName, crudOptions);
    case ServiceName.PlaceIndex:
      return getPlaceIndexIamPolicies(resourceName, crudOptions);
    default:
      printer.warn(`${service} not supported in category ${category}`);
  }
  return {policy: [], attributes: []};
}

export const verifySupportedRegion = (): boolean => {
  const currentRegion = stateManager.getMeta()?.providers[provider]?.Region;
  if(!supportedRegions.includes(currentRegion)) {
    printer.error(`Geo category is not supported in the region: [${currentRegion}]`);
    return false;
  }
  return true;
};

/**
 * Check if any Geo resource exists
 */
 export const checkAnyGeoResourceExists = async (): Promise<boolean> => {
  const geoMeta = stateManager.getMeta()?.[category];
  return geoMeta && Object.keys(geoMeta) && Object.keys(geoMeta).length > 0;
}
