import { $TSContext, $TSObject, stateManager, pathManager } from 'amplify-cli-core';
import { PlaceIndexParameters } from './placeIndexParams';
import _ from 'lodash';
import { parametersFileName, provider, ServiceName } from './constants';
import { category } from '../constants';
import { PlaceIndexStack } from '../service-stacks/placeIndexStack';
import {
  updateParametersFile,
  generateTemplateFile,
  updateDefaultResource,
  readResourceMetaParameters,
  checkAuthConfig,
  getAuthResourceName,
  ResourceDependsOn,
  getResourceDependencies
} from './resourceUtils';
import { App } from '@aws-cdk/core';
import { getTemplateMappings } from '../provider-controllers';
import { DataProvider } from './resourceParams';

export const createPlaceIndexResource = async (context: $TSContext, parameters: PlaceIndexParameters) => {
  // allow unauth access for identity pool if guest access is enabled
  await checkAuthConfig(context, parameters, ServiceName.PlaceIndex);

  const authResourceName = await getAuthResourceName(context);

  // generate CFN files
  const templateMappings = await getTemplateMappings(context);
  const placeIndexStack = new PlaceIndexStack(new App(), 'PlaceIndexStack', { ...parameters, ...templateMappings, authResourceName });
  generateTemplateFile(placeIndexStack, parameters.name);
  saveCFNParameters(parameters);
  stateManager.setResourceInputsJson(pathManager.findProjectRoot(), category, parameters.name, { groupPermissions: parameters.groupPermissions });

  const placeIndexMetaParameters = constructPlaceIndexMetaParameters(parameters, authResourceName);

  // update the default place index
  if (parameters.isDefault) {
    // remove the previous default place index
    await updateDefaultResource(context, ServiceName.PlaceIndex);
  }

  context.amplify.updateamplifyMetaAfterResourceAdd(category, parameters.name, placeIndexMetaParameters);
};

export const modifyPlaceIndexResource = async (context: $TSContext, parameters: PlaceIndexParameters) => {
  // allow unauth access for identity pool if guest access is enabled
  await checkAuthConfig(context, parameters, ServiceName.PlaceIndex);

  const authResourceName = await getAuthResourceName(context);
  // generate CFN files
  const templateMappings = await getTemplateMappings(context);
  const placeIndexStack = new PlaceIndexStack(new App(), 'PlaceIndexStack', { ...parameters, ...templateMappings, authResourceName });
  generateTemplateFile(placeIndexStack, parameters.name);
  saveCFNParameters(parameters);
  stateManager.setResourceInputsJson(pathManager.findProjectRoot(), category, parameters.name, { groupPermissions: parameters.groupPermissions });

  // update the default place index
  if (parameters.isDefault) {
    await updateDefaultResource(context, ServiceName.PlaceIndex, parameters.name);
  }

  const placeIndexMetaParameters = constructPlaceIndexMetaParameters(parameters, authResourceName);

  const paramsToUpdate = ['accessType', 'dependsOn'] as const;
  paramsToUpdate.forEach(param => {
    context.amplify.updateamplifyMetaAfterResourceUpdate(category, parameters.name, param, placeIndexMetaParameters[param]);
  });
  // remove the pricingPlan if present on old resources
  context.amplify.updateamplifyMetaAfterResourceUpdate(category, parameters.name, 'pricingPlan', undefined);
};

function saveCFNParameters(
  parameters: Pick<PlaceIndexParameters, 'name' | 'dataProvider' | 'dataSourceIntendedUse' | 'isDefault'>,
) {
  const params = {
    authRoleName: {
      Ref: 'AuthRoleName',
    },
    unauthRoleName: {
      Ref: 'UnauthRoleName',
    },
    indexName: parameters.name,
    dataProvider: parameters.dataProvider === DataProvider.Esri ? 'Esri' : 'Here',
    dataSourceIntendedUse: parameters.dataSourceIntendedUse,
    isDefault: parameters.isDefault,
    pricingPlan: undefined
  };
  updateParametersFile(params, parameters.name, parametersFileName);
}

/**
 * Gives the Place Index resource configurations to be stored in Amplify Meta file
 */
export const constructPlaceIndexMetaParameters = (params: PlaceIndexParameters, authResourceName: string): PlaceIndexMetaParameters => {
  const dependsOnResources = getResourceDependencies(params.groupPermissions, authResourceName);

  let result: PlaceIndexMetaParameters = {
    isDefault: params.isDefault,
    providerPlugin: provider,
    service: ServiceName.PlaceIndex,
    dataProvider: params.dataProvider,
    dataSourceIntendedUse: params.dataSourceIntendedUse,
    accessType: params.accessType,
    dependsOn: dependsOnResources
  };
  return result;
};

/**
 * The Meta information stored for a Place Index Resource
 */
export type PlaceIndexMetaParameters = Pick<
  PlaceIndexParameters,
  'isDefault' | 'accessType' | 'dataSourceIntendedUse' | 'dataProvider'
> & {
  providerPlugin: string;
  service: string;
  dependsOn: ResourceDependsOn[];
};

export const getCurrentPlaceIndexParameters = async (indexName: string): Promise<Partial<PlaceIndexParameters>> => {
  const currentIndexMetaParameters = (await readResourceMetaParameters(ServiceName.PlaceIndex, indexName)) as PlaceIndexMetaParameters;
  const currentIndexParameters = stateManager.getResourceInputsJson(pathManager.findProjectRoot(), category, indexName, { throwIfNotExist: false }) || {};
  return {
    dataProvider: currentIndexMetaParameters.dataProvider,
    dataSourceIntendedUse: currentIndexMetaParameters.dataSourceIntendedUse,
    accessType: currentIndexMetaParameters.accessType,
    isDefault: currentIndexMetaParameters.isDefault,
    groupPermissions: currentIndexParameters?.groupPermissions || []
  };
};

export const getPlaceIndexIamPolicies = (resourceName: string, crudOptions: string[]): { policy: $TSObject[]; attributes: string[] } => {
  const policy = [];
  const actions = new Set<string>();

  crudOptions.forEach(crudOption => {
    switch (crudOption) {
      case 'create':
        actions.add('geo:CreatePlaceIndex');
        break;
      case 'read':
        actions.add('geo:DescribePlaceIndex');
        actions.add('geo:SearchPlaceIndexForPosition');
        actions.add('geo:SearchPlaceIndexForText');
        actions.add('geo:SearchPlaceIndexForSuggestions');
        break;
      case 'delete':
        actions.add('geo:DeletePlaceIndex');
        break;
      default:
        break;
    }
  });

  let placeIndexPolicy = {
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
            ':place-index/',
            {
              Ref: `${category}${resourceName}Name`,
            },
          ],
        ],
      },
    ],
  };
  policy.push(placeIndexPolicy);
  const attributes = ['Name'];

  return { policy, attributes };
};
