import { $TSContext, $TSObject, JSONUtilities, pathManager } from 'amplify-cli-core';
import { GeofenceCollectionParameters } from './geofenceCollectionParams';
import _ from 'lodash';
import { parametersFileName, provider, ServiceName } from './constants';
import { authCategoryName, category } from '../constants';
import { GeofenceCollectionStack } from '../service-stacks/geofenceCollectionStack';
import {
  updateParametersFile,
  generateTemplateFile,
  updateDefaultResource,
  readResourceMetaParameters,
  getAuthResourceName,
  updateGeoPricingPlan,
  ResourceDependsOn
} from './resourceUtils';
import { App } from '@aws-cdk/core';
import { getTemplateMappings } from '../provider-controllers';
import * as path from 'path';

const geofenceCollectionParamsFileName = 'geofence-collection-params.json';

export const createGeofenceCollectionResource = async (context: $TSContext, parameters: GeofenceCollectionParameters) => {
  const authResourceName = await getAuthResourceName(context);
  // generate CFN files
  const templateMappings = await getTemplateMappings(context);
  const geofenceCollectionStack = new GeofenceCollectionStack(
    new App(),
    'GeofenceCollectionStack',
    { ...parameters, ...templateMappings, authResourceName }
  );
  generateTemplateFile(geofenceCollectionStack, parameters.name);
  saveCFNParameters(parameters);
  writeGeofenceCollectionParams(parameters);

  const geofenceCollectionMetaParameters = constructGeofenceCollectionMetaParameters(parameters, authResourceName);

  // update the default Geofence collection
  if (parameters.isDefault) {
    // remove the previous default Geofence collection
    await updateDefaultResource(context, ServiceName.GeofenceCollection);
  }

  // update the pricing plan for All Geo resources
  if (parameters.pricingPlan) {
    await updateGeoPricingPlan(context, parameters.pricingPlan);
  }

  context.amplify.updateamplifyMetaAfterResourceAdd(category, parameters.name, geofenceCollectionMetaParameters);
};

export const modifyGeofenceCollectionResource = async (
  context: $TSContext,
  parameters: GeofenceCollectionParameters,
) => {
  const authResourceName = await getAuthResourceName(context);
  // generate CFN files
  const templateMappings = await getTemplateMappings(context);
  const geofenceCollectionStack = new GeofenceCollectionStack(
    new App(),
    'GeofenceCollectionStack',
    { ...parameters, ...templateMappings, authResourceName }
  );
  generateTemplateFile(geofenceCollectionStack, parameters.name);
  saveCFNParameters(parameters);
  writeGeofenceCollectionParams(parameters);

  // update the default Geofence collection
  if (parameters.isDefault) {
    await updateDefaultResource(context, ServiceName.GeofenceCollection, parameters.name);
  }

  // update the pricing plan for All Geo resources
  if (parameters.pricingPlan) {
    await updateGeoPricingPlan(context, parameters.pricingPlan);
  }

  const geofenceCollectionMetaParameters = constructGeofenceCollectionMetaParameters(parameters, authResourceName);

  const paramsToUpdate = ['pricingPlan', 'accessType', 'dependsOn', 'dataProvider'];
  paramsToUpdate.forEach(param => {
    context.amplify.updateamplifyMetaAfterResourceUpdate(category, parameters.name, param, (geofenceCollectionMetaParameters as $TSObject)[param]);
  });
};

function saveCFNParameters(
  parameters: Pick<GeofenceCollectionParameters, 'name' | 'dataProvider' | 'pricingPlan' | 'isDefault'>,
) {
  const params = {
    collectionName: parameters.name,
    dataProvider: parameters.dataProvider,
    pricingPlan: parameters.pricingPlan,
    isDefault: parameters.isDefault
  };
  updateParametersFile(params, parameters.name, parametersFileName);
}

/**
 * Gives the Geofence collection resource configurations to be stored in Amplify Meta file
 */
export const constructGeofenceCollectionMetaParameters = (params: GeofenceCollectionParameters, authResourceName: string): GeofenceCollectionMetaParameters => {
  const dependsOnResources = [
    {
      category: authCategoryName,
      resourceName: authResourceName,
      attributes: ['UserPoolId']
    }
  ];
  Object.keys(params.groupPermissions).forEach( group => {
    dependsOnResources.push({
      category: authCategoryName,
      resourceName: 'userPoolGroups',
      attributes: [`${group}GroupRole`]
    });
  });

  const result: GeofenceCollectionMetaParameters = {
    isDefault: params.isDefault,
    providerPlugin: provider,
    service: ServiceName.GeofenceCollection,
    dataProvider: params.dataProvider,
    pricingPlan: params.pricingPlan,
    accessType: params.accessType,
    dependsOn: dependsOnResources
  };
  return result;
};

/**
 * The Meta information stored for a Geofence collection Resource
 */
export type GeofenceCollectionMetaParameters = Pick<
  GeofenceCollectionParameters,
  'isDefault' | 'pricingPlan' | 'accessType' | 'dataProvider'
> & {
  providerPlugin: string;
  service: string;
  dependsOn: ResourceDependsOn[];
};

export const getCurrentGeofenceCollectionParameters = async (collectionName: string): Promise<Partial<GeofenceCollectionParameters>> => {
  const currentCollectionMetaParameters = (await readResourceMetaParameters(ServiceName.GeofenceCollection, collectionName)) as GeofenceCollectionMetaParameters;
  const currentCollectionParameters = await readGeofenceCollectionParams(collectionName);
  return {
    dataProvider: currentCollectionMetaParameters.dataProvider,
    pricingPlan: currentCollectionMetaParameters.pricingPlan,
    accessType: currentCollectionMetaParameters.accessType,
    isDefault: currentCollectionMetaParameters.isDefault,
    groupPermissions: currentCollectionParameters.groupPermissions
  };
};

export const getGeofenceCollectionIamPolicies = (resourceName: string, crudOptions: string[]): { policy: $TSObject[]; attributes: string[] } => {
  const policy = [];
  const actions = new Set<string>();

  crudOptions.forEach(crudOption => {
    switch (crudOption) {
      case 'create':
        actions.add('geo:CreateGeofenceCollection');
        break;
      case 'read':
        actions.add('geo:DescribeGeofenceCollection');
        break;
      case 'delete':
        actions.add('geo:DeleteGeofenceCollection');
        break;
      default:
        break;
    }
  });

  let geofenceCollectionPolicy = {
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
            ':geofence-collection/',
            {
              Ref: `${category}${resourceName}Name`,
            },
          ],
        ],
      },
    ],
  };
  policy.push(geofenceCollectionPolicy);
  const attributes = ['Name'];

  return { policy, attributes };
};

export const readGeofenceCollectionParams = async (resourceName: string): Promise<Pick<GeofenceCollectionParameters, 'groupPermissions'>> => {
  const groupPermissions = JSONUtilities.readJson<Pick<GeofenceCollectionParameters, 'groupPermissions'>>(
    getGeofenceCollectionParamsFilePath(resourceName),
    { throwIfNotExist: false }
  ) || { groupPermissions: {}};
  return groupPermissions;
};

export const writeGeofenceCollectionParams = async (params: Pick<GeofenceCollectionParameters, 'name' | 'groupPermissions'>) => {
  JSONUtilities.writeJson(
    getGeofenceCollectionParamsFilePath(params.name),
    { groupPermissions: params.groupPermissions }
  );
}

export const getGeofenceCollectionParamsFilePath = (resourceName: string): string => {
  return path.join(pathManager.getBackendDirPath(), category, resourceName, geofenceCollectionParamsFileName);
};

export const crudPermissionsMap: Record<string, string[]> = {
  'Read geofence': ['geo:GetGeofence'],
  'Create/Update geofence': ['geo:PutGeofence', 'geo:BatchPutGeofence'],
  'Delete geofence': ['geo:BatchDeleteGeofence'],
  'List geofences': ['geo:ListGeofences']
};
