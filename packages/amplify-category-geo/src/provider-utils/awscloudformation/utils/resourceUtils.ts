import { JSONUtilities, pathManager, $TSAny, $TSContext, $TSObject } from 'amplify-cli-core';
import { category } from '../../../constants';
import path from 'path';
import { MapParameters } from './mapParams';
import _ from 'lodash';


// Merges other with existing in a non-destructive way.
// Specifically, scalar values will not be overwritten
// Objects will have field added but not removed or modified
// Arrays will be appended to, duplicates are removed
export function merge(existing: Partial<MapParameters>, other?: Partial<MapParameters>): Partial<MapParameters> {
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

export function createParametersFile(parameters: $TSObject, resourceName: string, parametersFileName: string) {
    const parametersFilePath = path.join(pathManager.getBackendDirPath(), category, resourceName, parametersFileName);
    const currentParameters: $TSAny = JSONUtilities.readJson(parametersFilePath, { throwIfNotExist: false }) || {};
    JSONUtilities.writeJson(parametersFilePath, { ...currentParameters, ...parameters });
}

export function readParametersFile(resourceName: string, parametersFileName: string): $TSAny {
    const parametersFilePath = path.join(pathManager.getBackendDirPath(), category, resourceName, parametersFileName);
    return JSONUtilities.readJson(parametersFilePath, { throwIfNotExist: false }) || {};
}

/**
 * Get the information stored in Amplify Meta for resources belonging to given type/service
 * @param context The Amplify Context object
 * @param service The type of the resource
 * @returns resource information available in Amplify Meta file
 */
export function getServiceMetaInfo(context:$TSContext, service: string): any {
    let serviceMetaInfo = {};
    const amplifyMeta = context.amplify.getProjectMeta();
    if (amplifyMeta[category] && Object.keys(amplifyMeta[category]).length > 0) {
        const categoryResources = amplifyMeta[category];
        Object.keys(categoryResources).forEach(resource => {
            const categoryResource = categoryResources[resource];
          if (categoryResource.service === service) {
            serviceMetaInfo[resource] = categoryResource;
          }
        });
    }
    return serviceMetaInfo;
}
