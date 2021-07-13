import { JSONUtilities, pathManager, $TSObject, stateManager, $TSContext } from 'amplify-cli-core';
import { category } from '../constants';
import path from 'path';
import _ from 'lodash';
import { BaseStack } from '../service-stacks/baseStack';
import { ServiceName } from './constants';


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
  });
};
