import { JSONUtilities, pathManager, $TSAny, $TSContext, $TSObject } from 'amplify-cli-core';
import { MapParameters, getGeoMapStyle } from './mapParams';
import _ from 'lodash';
import path from 'path';
import { parametersFileName, provider, ServiceName } from './constants';
import { category } from '../../../constants';
import { MapStack } from '../service-stacks/mapStack';

export function createMapResource(context: $TSContext, parameters: MapParameters) {
  // generate CFN files
  generateTemplateFile(parameters);
  saveCFNParameters(parameters);

  const mapMetaParameters = constructMapMetaParameters(parameters);

  // update the default map
  if (parameters.isDefaultMap) {
    // remove the previous default map
    updateDefaultMap(context);
  }

  context.amplify.updateamplifyMetaAfterResourceAdd(
    category,
    parameters.mapName,
    mapMetaParameters
  );
}

export function modifyMapResource(context: $TSContext, parameters: Pick<MapParameters, 'accessType' | 'mapName' | 'isDefaultMap'>) {
  // generate CFN files
  generateTemplateFile(parameters);

  // update the default map
  if (parameters.isDefaultMap) {
    // remove the previous default map
    updateDefaultMap(context);
  }

  context.amplify.updateamplifyMetaAfterResourceUpdate(
    category,
    parameters.mapName,
    'isDefaultMap',
    parameters.isDefaultMap
  );
}

export function saveCFNParameters(
  parameters: Pick<MapParameters, 'mapName' | 'mapStyleType' | 'dataProvider' | 'pricingPlan'>
) {
    const params = {
      authRoleName: {
        "Ref": "AuthRoleName"
      },
      unauthRoleName: {
        "Ref": "UnauthRoleName"
      },
      mapName: parameters.mapName,
      mapStyle: getGeoMapStyle(parameters.dataProvider, parameters.mapStyleType),
      pricingPlan: parameters.pricingPlan
    };
    createParametersFile(params, parameters.mapName, parametersFileName);
}

export function generateTemplateFile(parameters: Pick<MapParameters, 'accessType' | 'mapName'>) {
    const mapStack = new MapStack(undefined, 'MapStack', parameters);
    const cfnFileName = (resourceName: string) => `${resourceName}-cloudformation-template.json`;
    const resourceDir = path.join(pathManager.getBackendDirPath(), category, parameters.mapName);
    JSONUtilities.writeJson(path.normalize(path.join(resourceDir, cfnFileName(parameters.mapName))), mapStack.toCloudFormation());
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

export function constructMapMetaParameters(params: MapParameters): MapMetaParameters {
  let result: MapMetaParameters = {
    isDefaultMap: true,
    providerPlugin: provider,
    service: ServiceName.Map,
    mapStyle: getGeoMapStyle(params.dataProvider, params.mapStyleType),
    pricingPlan: params.pricingPlan
  };
  return result;
}

export type MapMetaParameters = Pick<MapParameters, 'isDefaultMap' | 'pricingPlan'> & {
  providerPlugin: string;
  service: string;
  mapStyle: string;
}

function updateDefaultMap(context: $TSContext) {
  const { amplify } = context;
  const { amplifyMeta } = amplify.getProjectDetails();

  if (amplifyMeta[category]) {
    const categoryResources = amplifyMeta[category];
    Object.keys(categoryResources).forEach(resource => {
      if (categoryResources[resource].service === ServiceName.Map && categoryResources[resource].isDefaultMap) {
        amplify.updateamplifyMetaAfterResourceUpdate(
          category,
          resource,
          'isDefaultMap',
          false
        );
      }
    });
  }
}
