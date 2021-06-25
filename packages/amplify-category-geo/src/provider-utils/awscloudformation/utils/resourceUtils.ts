import { JSONUtilities, pathManager, $TSAny, $TSContext, $TSObject } from 'amplify-cli-core';
import { category } from '../../../constants';
import path from 'path';

export function createParametersFile(parameters: $TSObject, resourceName: string, parametersFileName: string) {
    const parametersFilePath = path.join(pathManager.getBackendDirPath(), category, resourceName, parametersFileName);
    const currentParameters: $TSAny = JSONUtilities.readJson(parametersFilePath, { throwIfNotExist: false }) || {};
    JSONUtilities.writeJson(parametersFilePath, { ...currentParameters, ...parameters });
}

export function readParametersFile(resourceName: string, parametersFileName: string): $TSAny {
    const parametersFilePath = path.join(pathManager.getBackendDirPath(), category, resourceName, parametersFileName);
    return JSONUtilities.readJson(parametersFilePath, { throwIfNotExist: false }) || {};
}

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
  