import { $TSContext, $TSObject, JSONUtilities, pathManager } from 'amplify-cli-core';
import { MapParameters, getGeoMapStyle, getMapStyleComponents } from './mapParams';
import _ from 'lodash';
import { parametersFileName, provider, ServiceName } from './constants';
import { authCategoryName, category } from '../constants';
import { MapStack } from '../service-stacks/mapStack';
import {
  updateParametersFile,
  getGeoServiceMeta,
  generateTemplateFile,
  updateDefaultResource,
  readResourceMetaParameters,
  checkAuthConfig,
  getAuthResourceName,
  ResourceDependsOn
} from './resourceUtils';
import { App } from '@aws-cdk/core';
import { getTemplateMappings } from '../provider-controllers';
import * as path from 'path';

const mapParamsFileName = 'map-params.json';

export const createMapResource = async (context: $TSContext, parameters: MapParameters) => {
  // allow unauth access for identity pool if guest access is enabled
  await checkAuthConfig(context, parameters, ServiceName.Map);

  const authResourceName = await getAuthResourceName(context);
  // generate CFN files
  const templateMappings = await getTemplateMappings(context);
  const mapStack = new MapStack(new App(), 'MapStack', { ...parameters, ...templateMappings, authResourceName });
  generateTemplateFile(mapStack, parameters.name);
  saveCFNParameters(parameters);
  writeMapParams(parameters);

  const mapMetaParameters = constructMapMetaParameters(parameters, authResourceName);

  // update the default map
  if (parameters.isDefault) {
    // remove the previous default map
    await updateDefaultResource(context, ServiceName.Map);
  }

  context.amplify.updateamplifyMetaAfterResourceAdd(category, parameters.name, mapMetaParameters);
};

export const modifyMapResource = async (context: $TSContext, parameters: MapParameters) => {
  // allow unauth access for identity pool if guest access is enabled
  await checkAuthConfig(context, parameters, ServiceName.Map);

  const authResourceName = await getAuthResourceName(context);
  // generate CFN files
  const templateMappings = await getTemplateMappings(context);
  const mapStack = new MapStack(new App(), 'MapStack', { ...parameters, ...templateMappings, authResourceName });
  generateTemplateFile(mapStack, parameters.name);
  saveCFNParameters(parameters);
  writeMapParams(parameters);

  // update the default map
  if (parameters.isDefault) {
    await updateDefaultResource(context, ServiceName.Map, parameters.name);
  }

  const mapMetaParameters = constructMapMetaParameters(parameters, authResourceName);

  const paramsToUpdate = ['accessType', 'pricingPlan', 'dependsOn'];
  paramsToUpdate.forEach(param => {
    context.amplify.updateamplifyMetaAfterResourceUpdate(category, parameters.name, param, (mapMetaParameters as $TSObject)[param]);
  });
};

function saveCFNParameters(parameters: Pick<MapParameters, 'name' | 'mapStyleType' | 'dataProvider' | 'isDefault'>) {
  const params = {
    authRoleName: {
      Ref: 'AuthRoleName',
    },
    unauthRoleName: {
      Ref: 'UnauthRoleName',
    },
    mapName: parameters.name,
    mapStyle: getGeoMapStyle(parameters.dataProvider, parameters.mapStyleType),
    isDefault: parameters.isDefault,
    pricingPlan: undefined
  };
  updateParametersFile(params, parameters.name, parametersFileName);
}

/**
 * Gives the Map resource configurations to be stored in Amplify Meta file
 */
export const constructMapMetaParameters = (params: MapParameters, authResourceName: string): MapMetaParameters => {
  const dependsOnResources = [
    {
      category: authCategoryName,
      resourceName: authResourceName,
      attributes: ['UserPoolId']
    }
  ];
  params.groupPermissions.forEach( group => {
    dependsOnResources.push({
      category: authCategoryName,
      resourceName: 'userPoolGroups',
      attributes: [`${group}GroupRole`]
    });
  });

  let result: MapMetaParameters = {
    isDefault: params.isDefault,
    providerPlugin: provider,
    service: ServiceName.Map,
    mapStyle: getGeoMapStyle(params.dataProvider, params.mapStyleType),
    accessType: params.accessType,
    dependsOn: dependsOnResources
  };
  return result;
};

/**
 * The Meta information stored for a Map Resource
 */
export type MapMetaParameters = Pick<MapParameters, 'isDefault' | 'accessType'> & {
  providerPlugin: string;
  service: string;
  mapStyle: string;
  dependsOn: ResourceDependsOn[];
};

export const getCurrentMapParameters = async (mapName: string): Promise<Partial<MapParameters>> => {
  const currentMapMetaParameters = (await readResourceMetaParameters(ServiceName.Map, mapName)) as MapMetaParameters;
  const currentMapParameters = await readMapParams(mapName);
  return {
    mapStyleType: getMapStyleComponents(currentMapMetaParameters.mapStyle).mapStyleType,
    dataProvider: getMapStyleComponents(currentMapMetaParameters.mapStyle).dataProvider,
    accessType: currentMapMetaParameters.accessType,
    isDefault: currentMapMetaParameters.isDefault,
    groupPermissions: currentMapParameters.groupPermissions
  };
};

/**
 * Generates friendly names for the map resources by appending map style
 * @param mapNames The maps for which friendly names are needed
 * @returns Friendly names for the given map resources
 */
export const getMapFriendlyNames = async (mapNames: string[]): Promise<string[]> => {
  const currentMapResources = await getGeoServiceMeta(ServiceName.Map);
  return mapNames.map(mapName => {
    const mapStyle = currentMapResources?.[mapName]?.mapStyle;
    return !!mapStyle ? `${mapName} (${mapStyle})` : mapName;
  });
};

export const getMapIamPolicies = (resourceName: string, crudOptions: string[]): { policy: $TSObject[]; attributes: string[] } => {
  const policy = [];
  const actions = new Set<string>();

  crudOptions.forEach(crudOption => {
    switch (crudOption) {
      case 'create':
        actions.add('geo:CreateMap');
        break;
      case 'read':
        actions.add('geo:DescribeMap');
        actions.add('geo:GetMapGlyphs');
        actions.add('geo:GetMapSprites');
        actions.add('geo:GetMapStyleDescriptor');
        actions.add('geo:GetMapTile');
        break;
      case 'delete':
        actions.add('geo:DeleteMap');
        break;
      default:
        break;
    }
  });

  let mapPolicy = {
    Effect: 'Allow',
    Action: Array.from(actions),
    Resource: [
      {
        'Fn::Join': [
          '',
          [
            'arn:aws:geo:',
            { Ref: 'AWS::Region' },
            ':',
            { Ref: 'AWS::AccountId' },
            ':map/',
            {
              Ref: `${category}${resourceName}Name`,
            },
          ],
        ],
      },
    ],
  };
  policy.push(mapPolicy);
  const attributes = ['Name'];

  return { policy, attributes };
};

export const readMapParams = async (resourceName: string): Promise<Pick<MapParameters, 'groupPermissions'>> => {
  const groupPermissions = JSONUtilities.readJson<Pick<MapParameters, 'groupPermissions'>>(
    getMapParamsFilePath(resourceName),
    { throwIfNotExist: false }
  ) || { groupPermissions: [] };
  return groupPermissions;
};

export const writeMapParams = async (params: Pick<MapParameters, 'name' | 'groupPermissions'>) => {
  JSONUtilities.writeJson(
    getMapParamsFilePath(params.name),
    { groupPermissions: params.groupPermissions }
  );
}

export const getMapParamsFilePath = (resourceName: string): string => {
  return path.join(pathManager.getBackendDirPath(), category, resourceName, mapParamsFileName);
};
