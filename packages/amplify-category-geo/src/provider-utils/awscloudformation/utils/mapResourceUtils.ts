import { JSONUtilities, pathManager, $TSAny, $TSContext, $TSObject } from 'amplify-cli-core';
import { MapParameters, getGeoMapStyle, getMapStyleComponents } from './mapParams';
import _ from 'lodash';
import path from 'path';
import { parametersFileName, provider, ServiceName } from './constants';
import { category } from '../../../constants';
import { MapStack } from '../service-stacks/mapStack';
import { AccessType } from './resourceParams';
import { createParametersFile, getServiceMetaInfo } from './resourceUtils';

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

export async function modifyMapResource(context: $TSContext, parameters: Pick<MapParameters, 'accessType' | 'mapName' | 'isDefaultMap'>) {
  // generate CFN files
  generateTemplateFile(parameters);

  // update the default map
  if (parameters.isDefaultMap) {
    await updateDefaultMap(context, parameters.mapName);
  }

  const paramsToUpdate = ['accessType'];
  paramsToUpdate.forEach(param => {
    context.amplify.updateamplifyMetaAfterResourceUpdate(
      category,
      parameters.mapName,
      param,
      parameters[param]
    );
  });
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

/**
 * creates a CDK stack for the Map resource and generates the CFN template
 */
export function generateTemplateFile(parameters: Pick<MapParameters, 'accessType' | 'mapName'>) {
    const mapStack = new MapStack(undefined, 'MapStack', parameters);
    const cfnFileName = (resourceName: string) => `${resourceName}-cloudformation-template.json`;
    const resourceDir = path.join(pathManager.getBackendDirPath(), category, parameters.mapName);
    JSONUtilities.writeJson(path.normalize(path.join(resourceDir, cfnFileName(parameters.mapName))), mapStack.toCloudFormation());
}

/**
 * Gives the Map resource configurations to be stored in Amplify Meta file
 */
export function constructMapMetaParameters(params: MapParameters): MapMetaParameters {
  let result: MapMetaParameters = {
    isDefaultMap: params.isDefaultMap,
    providerPlugin: provider,
    service: ServiceName.Map,
    mapStyle: getGeoMapStyle(params.dataProvider, params.mapStyleType),
    pricingPlan: params.pricingPlan,
    accessType: params.accessType
  };
  return result;
}

/**
 * Get the Map resource configurations stored in Amplify Meta file
 */
export function readMapMetaParameters(context: $TSContext, mapName: string): MapMetaParameters {
  const serviceMetaInfo = getServiceMetaInfo(context, ServiceName.Map);
  let mapMetaParameters: MapMetaParameters;
  Object.keys(serviceMetaInfo).forEach(resource => {
    const resourceMetaInfo = serviceMetaInfo[resource];
    if (resource === mapName) {
      mapMetaParameters = {
        ...resourceMetaInfo
      };
    }
  });
  if (!mapMetaParameters) {
    throw new Error(`Error reading Map Meta Parameters for ${mapName}`);
  }
  else return mapMetaParameters;
}

export type MapMetaParameters = Pick<MapParameters, 'isDefaultMap' | 'pricingPlan'> & {
  providerPlugin: string;
  service: string;
  mapStyle: string;
  accessType: AccessType;
}

export async function updateDefaultMap(context: $TSContext, defaultMap?: string) {
  const currentMapResources = await getServiceMetaInfo(context, ServiceName.Map);
  Object.keys(currentMapResources).forEach(resource => {
    context.amplify.updateamplifyMetaAfterResourceUpdate(
      category,
      resource,
      'isDefaultMap',
      (defaultMap === resource)
    );
  });
}

export function getCurrentMapParameters(context: $TSContext, mapName: string): Partial<MapParameters> {
  const currentMapMetaParameters: MapMetaParameters = readMapMetaParameters(context, mapName);
  return {
    mapStyleType: getMapStyleComponents(currentMapMetaParameters.mapStyle).mapStyleType,
    dataProvider: getMapStyleComponents(currentMapMetaParameters.mapStyle).dataProvider,
    pricingPlan: currentMapMetaParameters.pricingPlan,
    accessType: currentMapMetaParameters.accessType,
    isDefaultMap: currentMapMetaParameters.isDefaultMap
  };
}

/**
 * Generates friendly names for the map resources by appending map style
 * @param context The Amplify Context object
 * @param mapNames The maps for which friendly names are needed
 * @returns Friendly names for the given map resources
 */
export async function getMapFriendlyName(context: $TSContext, mapNames: string[]): Promise<string[]> {
  const currentMapResources = await getServiceMetaInfo(context, ServiceName.Map);
  if (currentMapResources && Object.keys(currentMapResources).length > 0) {
      return mapNames.map(mapName => {
          if (currentMapResources[mapName] && currentMapResources[mapName].mapStyle) {
              return mapName + ' (' + currentMapResources[mapName].mapStyle + ')';
          }
          return mapName;
      })
  }
  return mapNames;
}
