import {
  $TSContext, $TSObject, stateManager, pathManager,
} from 'amplify-cli-core';
import { App } from 'aws-cdk-lib';
import { MapParameters, getGeoMapStyle, getMapStyleComponents } from './mapParams';
import { parametersFileName, provider, ServiceName } from './constants';
import { category } from '../constants';
import { MapStack } from '../service-stacks/mapStack';
// eslint-disable-next-line import/no-cycle
import {
  updateParametersFile,
  getGeoServiceMeta,
  generateTemplateFile,
  updateDefaultResource,
  readResourceMetaParameters,
  checkAuthConfig,
  getAuthResourceName,
  ResourceDependsOn,
  getResourceDependencies,
} from './resourceUtils';
// eslint-disable-next-line import/no-cycle
import { getTemplateMappings } from '../provider-controllers';

/**
 * creates amplify map resource
 */
export const createMapResource = async (context: $TSContext, parameters: MapParameters): Promise<void> => {
  // allow unauth access for identity pool if guest access is enabled
  await checkAuthConfig(context, parameters, ServiceName.Map);

  const authResourceName = await getAuthResourceName(context);
  // generate CFN files
  const templateMappings = await getTemplateMappings(context);
  const mapStack = new MapStack(new App(), 'MapStack', { ...parameters, ...templateMappings, authResourceName });
  generateTemplateFile(mapStack, parameters.name);
  saveCFNParameters(parameters);
  stateManager.setResourceInputsJson(
    pathManager.findProjectRoot(),
    category,
    parameters.name,
    { groupPermissions: parameters.groupPermissions },
  );

  const mapMetaParameters = constructMapMetaParameters(parameters, authResourceName);

  // update the default map
  if (parameters.isDefault) {
    // remove the previous default map
    await updateDefaultResource(context, ServiceName.Map);
  }

  context.amplify.updateamplifyMetaAfterResourceAdd(category, parameters.name, mapMetaParameters);
};

/**
 * modifies amplify map resource
 */
export const modifyMapResource = async (context: $TSContext, parameters: MapParameters): Promise<void> => {
  // allow unauth access for identity pool if guest access is enabled
  await checkAuthConfig(context, parameters, ServiceName.Map);

  const authResourceName = await getAuthResourceName(context);
  // generate CFN files
  const templateMappings = await getTemplateMappings(context);
  const mapStack = new MapStack(new App(), 'MapStack', { ...parameters, ...templateMappings, authResourceName });
  generateTemplateFile(mapStack, parameters.name);
  saveCFNParameters(parameters);
  stateManager.setResourceInputsJson(
    pathManager.findProjectRoot(),
    category,
    parameters.name,
    { groupPermissions: parameters.groupPermissions },
  );

  // update the default map
  if (parameters.isDefault) {
    await updateDefaultResource(context, ServiceName.Map, parameters.name);
  }

  const mapMetaParameters = constructMapMetaParameters(parameters, authResourceName);

  const paramsToUpdate = ['accessType', 'dependsOn'] as const;
  paramsToUpdate.forEach(param => {
    context.amplify.updateamplifyMetaAfterResourceUpdate(category, parameters.name, param, mapMetaParameters[param]);
    context.amplify.updateBackendConfigAfterResourceUpdate(category, parameters.name, param, mapMetaParameters[param]);
  });
  // remove the pricingPlan if present on old resources where pricingPlan is configurable
  context.amplify.updateamplifyMetaAfterResourceUpdate(category, parameters.name, 'pricingPlan', undefined);
  context.amplify.updateBackendConfigAfterResourceUpdate(category, parameters.name, 'pricingPlan', undefined);
};

const saveCFNParameters = (parameters: Pick<MapParameters, 'name' | 'mapStyleType' | 'dataProvider' | 'isDefault'>):void => {
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
    pricingPlan: undefined,
  };
  updateParametersFile(params, parameters.name, parametersFileName);
};

/**
 * Gives the Map resource configurations to be stored in Amplify Meta file
 */
export const constructMapMetaParameters = (params: MapParameters, authResourceName: string): MapMetaParameters => {
  const dependsOnResources = getResourceDependencies(params.groupPermissions, authResourceName);

  const result: MapMetaParameters = {
    isDefault: params.isDefault,
    providerPlugin: provider,
    service: ServiceName.Map,
    mapStyle: getGeoMapStyle(params.dataProvider, params.mapStyleType),
    accessType: params.accessType,
    dependsOn: dependsOnResources,
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

/**
 * get CurrentMap Parameters
 */
export const getCurrentMapParameters = async (mapName: string): Promise<Partial<MapParameters>> => {
  const currentMapMetaParameters = (await readResourceMetaParameters(ServiceName.Map, mapName)) as MapMetaParameters;
  const currentMapParameters = stateManager.getResourceInputsJson(pathManager.findProjectRoot(),
    category, mapName, { throwIfNotExist: false }) || {};
  return {
    mapStyleType: getMapStyleComponents(currentMapMetaParameters.mapStyle).mapStyleType,
    dataProvider: getMapStyleComponents(currentMapMetaParameters.mapStyle).dataProvider,
    accessType: currentMapMetaParameters.accessType,
    isDefault: currentMapMetaParameters.isDefault,
    groupPermissions: currentMapParameters?.groupPermissions || [],
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
    return mapStyle ? `${mapName} (${mapStyle})` : mapName;
  });
};

/**
 * get IAM policies for map resource
 */
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
        // eslint-disable-next-line spellcheck/spell-checker
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

  const mapPolicy = {
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
