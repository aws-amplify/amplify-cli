import { JSONUtilities, pathManager, $TSAny, $TSContext, $TSObject } from 'amplify-cli-core';
import { MapParameters, getGeoMapStyle } from './mapParams';
import _ from 'lodash';
import path from 'path';
import { parametersFileName, provider, ServiceName } from './constants';
import { category } from '../../../constants';
import { MapStack } from '../service-stacks/mapStack';
import { PricingPlan } from './resourceParams';

export function createMapResource(context: $TSContext, parameters: MapParameters) {
  // generate CFN files
  generateCfnFile(parameters);

  context.amplify.updateamplifyMetaAfterResourceAdd(
    category,
    parameters.mapName,
    updateAmplifyMeta(context, parameters),
  );
}

export function updateMapResource(context: $TSContext, parameters: MapParameters) {
  // generate CFN files
  generateCfnFile(parameters);

  const mapMetaParameters = updateAmplifyMeta(context, parameters);
  
  // context.amplify.updateamplifyMetaAfterResourceUpdate(
  //   category,
  //   parameters.mapName,
  //   ,
  // );
}

function generateCfnFile(parameters: MapParameters) {
  generateTemplateFile(parameters);
  saveCFNParameters(parameters);
}


function saveCFNParameters(
  parameters: Pick<MapParameters, 'mapName'>
) {
    const params = {
      authRoleName: {
        "Ref": "AuthRoleName"
      },
      unauthRoleName: {
        "Ref": "UnauthRoleName"
      }
    };
    createParametersFile(params, parameters.mapName, parametersFileName);
}

function generateTemplateFile(parameters: MapParameters) {
    const mapStack = new MapStack(undefined, 'MapStack', parameters);
    const cfnFileName = (resourceName: string) => `${resourceName}-cloudformation-template.json`;
    const resourceDir = path.join(pathManager.getBackendDirPath(), category, parameters.mapName);
    JSONUtilities.writeJson(path.normalize(path.join(resourceDir, cfnFileName(parameters.mapName))), mapStack.toCloudFormation());
}

function createParametersFile(parameters: $TSObject, resourceName: string, parametersFileName: string) {
  const parametersFilePath = path.join(pathManager.getBackendDirPath(), category, resourceName, parametersFileName);
  const currentParameters: $TSAny = JSONUtilities.readJson(parametersFilePath, { throwIfNotExist: false }) || {};
  JSONUtilities.writeJson(parametersFilePath, { ...currentParameters, ...parameters });
}

function updateAmplifyMeta(context: $TSContext, params: MapParameters
  ): $TSAny {
  let result: $TSObject = {
    isDefaultMap: params.isDefaultMap,
    providerPlugin: provider,
    service: ServiceName.Map,
    mapStyle: getGeoMapStyle(params.dataProvider, params.mapStyleType),
    accessType: params.accessType,
    pricingPlan: params.pricingPlan
  };

  if (params.isDefaultMap) {
    // remove the previous default map
    updateDefaultMap(context);
  }

  return result;
}

type MapMetaParameters = Pick<MapParameters, 'isDefaultMap' | 'dataProvider' | 'pricingPlan' | 'accessType'> & 'mapStyle'

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
