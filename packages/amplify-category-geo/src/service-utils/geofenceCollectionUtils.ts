import {
  $TSContext, $TSObject, stateManager, pathManager,
} from 'amplify-cli-core';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { App } from 'aws-cdk-lib';
import { GeofenceCollectionParameters } from './geofenceCollectionParams';
import { parametersFileName, provider, ServiceName } from './constants';
import { category } from '../constants';
// eslint-disable-next-line import/no-cycle
import { GeofenceCollectionStack } from '../service-stacks/geofenceCollectionStack';
// eslint-disable-next-line import/no-cycle
import {
  updateParametersFile,
  generateTemplateFile,
  updateDefaultResource,
  readResourceMetaParameters,
  getAuthResourceName,
  ResourceDependsOn,
  getResourceDependencies,
} from './resourceUtils';
// eslint-disable-next-line import/no-cycle
import { getTemplateMappings } from '../provider-controllers';

/**
 * creates amplify geofence collection resource
 */
export const createGeofenceCollectionResource = async (context: $TSContext, parameters: GeofenceCollectionParameters): Promise<void> => {
  const authResourceName = await getAuthResourceName(context);
  // generate CFN files
  const templateMappings = await getTemplateMappings(context);
  const geofenceCollectionStack = new GeofenceCollectionStack(
    new App(),
    'GeofenceCollectionStack',
    { ...parameters, ...templateMappings, authResourceName },
  );
  generateTemplateFile(geofenceCollectionStack, parameters.name);
  saveCFNParameters(parameters);
  stateManager.setResourceInputsJson(
    pathManager.findProjectRoot(),
    category,
    parameters.name,
    { groupPermissions: parameters.groupPermissions },
  );

  const geofenceCollectionMetaParameters = constructGeofenceCollectionMetaParameters(parameters, authResourceName);

  // update the default Geofence collection
  if (parameters.isDefault) {
    // remove the previous default Geofence collection
    await updateDefaultResource(context, ServiceName.GeofenceCollection);
  }

  context.amplify.updateamplifyMetaAfterResourceAdd(category, parameters.name, geofenceCollectionMetaParameters);
  context.amplify.updateBackendConfigAfterResourceAdd(category, parameters.name, geofenceCollectionMetaParameters);
};

/**
 * modify amplify geofence resource
 */
export const modifyGeofenceCollectionResource = async (
  context: $TSContext,
  parameters: GeofenceCollectionParameters,
): Promise<void> => {
  const authResourceName = await getAuthResourceName(context);
  // generate CFN files
  const templateMappings = await getTemplateMappings(context);
  const geofenceCollectionStack = new GeofenceCollectionStack(
    new App(),
    'GeofenceCollectionStack',
    { ...parameters, ...templateMappings, authResourceName },
  );
  generateTemplateFile(geofenceCollectionStack, parameters.name);
  saveCFNParameters(parameters);
  stateManager.setResourceInputsJson(
    pathManager.findProjectRoot(),
    category,
    parameters.name,
    { groupPermissions: parameters.groupPermissions },
  );

  // update the default Geofence collection
  if (parameters.isDefault) {
    await updateDefaultResource(context, ServiceName.GeofenceCollection, parameters.name);
  }

  const geofenceCollectionMetaParameters = constructGeofenceCollectionMetaParameters(parameters, authResourceName);

  const paramsToUpdate = ['accessType', 'dependsOn'] as const;
  paramsToUpdate.forEach(param => {
    context.amplify.updateamplifyMetaAfterResourceUpdate(category, parameters.name, param, geofenceCollectionMetaParameters[param]);
    context.amplify.updateBackendConfigAfterResourceUpdate(category, parameters.name, param, geofenceCollectionMetaParameters[param]);
  });
};

const saveCFNParameters = (
  parameters: Pick<GeofenceCollectionParameters, 'name' | 'isDefault'>,
): void => {
  const params = {
    collectionName: parameters.name,
    isDefault: parameters.isDefault,
  };
  updateParametersFile(params, parameters.name, parametersFileName);
};

/**
 * Gives the Geofence collection resource configurations to be stored in Amplify Meta file
 */
export const constructGeofenceCollectionMetaParameters = (params: GeofenceCollectionParameters,
  authResourceName: string): GeofenceCollectionMetaParameters => {
  const dependsOnResources = getResourceDependencies(Object.keys(params.groupPermissions), authResourceName);

  const result: GeofenceCollectionMetaParameters = {
    isDefault: params.isDefault,
    providerPlugin: provider,
    service: ServiceName.GeofenceCollection,
    accessType: params.accessType,
    dependsOn: dependsOnResources,
  };
  return result;
};

/**
 * The Meta information stored for a Geofence collection Resource
 */
export type GeofenceCollectionMetaParameters = Pick<
  GeofenceCollectionParameters,
  'isDefault' | 'accessType'
> & {
  providerPlugin: string;
  service: string;
  dependsOn: ResourceDependsOn[];
};

/**
 * get Current GeofenceCollection Parameters
 */
export const getCurrentGeofenceCollectionParameters = async (collectionName: string): Promise<Partial<GeofenceCollectionParameters>> => {
  const currentCollectionMetaParameters = (await readResourceMetaParameters(ServiceName.GeofenceCollection,
    collectionName)) as GeofenceCollectionMetaParameters;
  const currentCollectionParameters = stateManager.getResourceInputsJson(pathManager.findProjectRoot(),
    category, collectionName, { throwIfNotExist: false }) || {};
  return {
    accessType: currentCollectionMetaParameters.accessType,
    isDefault: currentCollectionMetaParameters.isDefault,
    groupPermissions: currentCollectionParameters?.groupPermissions || {},
  };
};

/**
 * get GeofenceCollection Iam Policies
 */
export const getGeofenceCollectionIamPolicies = (resourceName: string,
  crudOptions: string[]): { policy: $TSObject[]; attributes: string[] } => {
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

  const geofenceCollectionPolicy = {
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

export const crudPermissionsMap: Record<string, string[]> = {
  'Read geofence': ['geo:GetGeofence'],
  'Create/Update geofence': ['geo:PutGeofence', 'geo:BatchPutGeofence'],
  'Delete geofence': ['geo:BatchDeleteGeofence'],
  'List geofences': ['geo:ListGeofences'],
};
