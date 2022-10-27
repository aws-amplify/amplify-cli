import {
  $TSContext, $TSObject, stateManager, pathManager,
} from 'amplify-cli-core';
import { App } from 'aws-cdk-lib';
import { PlaceIndexParameters } from './placeIndexParams';
import { parametersFileName, provider, ServiceName } from './constants';
import { category } from '../constants';
import { PlaceIndexStack } from '../service-stacks/placeIndexStack';
// eslint-disable-next-line import/no-cycle
import {
  updateParametersFile,
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
import { DataProvider } from './resourceParams';

/**
 * creates place index resource
 */
export const createPlaceIndexResource = async (context: $TSContext, parameters: PlaceIndexParameters): Promise<void> => {
  // allow unauth access for identity pool if guest access is enabled
  await checkAuthConfig(context, parameters, ServiceName.PlaceIndex);

  const authResourceName = await getAuthResourceName(context);

  // generate CFN files
  const templateMappings = await getTemplateMappings(context);
  const placeIndexStack = new PlaceIndexStack(new App(), 'PlaceIndexStack', { ...parameters, ...templateMappings, authResourceName });
  generateTemplateFile(placeIndexStack, parameters.name);
  saveCFNParameters(parameters);
  stateManager.setResourceInputsJson(
    pathManager.findProjectRoot(),
    category,
    parameters.name,
    { groupPermissions: parameters.groupPermissions },
  );

  const placeIndexMetaParameters = constructPlaceIndexMetaParameters(parameters, authResourceName);

  // update the default place index
  if (parameters.isDefault) {
    // remove the previous default place index
    await updateDefaultResource(context, ServiceName.PlaceIndex);
  }

  context.amplify.updateamplifyMetaAfterResourceAdd(category, parameters.name, placeIndexMetaParameters);
};

/**
 * modifies place index resource
 */
export const modifyPlaceIndexResource = async (context: $TSContext, parameters: PlaceIndexParameters): Promise<void> => {
  // allow unauth access for identity pool if guest access is enabled
  await checkAuthConfig(context, parameters, ServiceName.PlaceIndex);

  const authResourceName = await getAuthResourceName(context);
  // generate CFN files
  const templateMappings = await getTemplateMappings(context);
  const placeIndexStack = new PlaceIndexStack(new App(), 'PlaceIndexStack', { ...parameters, ...templateMappings, authResourceName });
  generateTemplateFile(placeIndexStack, parameters.name);
  saveCFNParameters(parameters);
  stateManager.setResourceInputsJson(
    pathManager.findProjectRoot(),
    category,
    parameters.name,
    { groupPermissions: parameters.groupPermissions },
  );

  // update the default place index
  if (parameters.isDefault) {
    await updateDefaultResource(context, ServiceName.PlaceIndex, parameters.name);
  }

  const placeIndexMetaParameters = constructPlaceIndexMetaParameters(parameters, authResourceName);

  const paramsToUpdate = ['accessType', 'dependsOn'] as const;
  paramsToUpdate.forEach(param => {
    context.amplify.updateamplifyMetaAfterResourceUpdate(category, parameters.name, param, placeIndexMetaParameters[param]);
    context.amplify.updateBackendConfigAfterResourceUpdate(category, parameters.name, param, placeIndexMetaParameters[param]);
  });
  // remove the pricingPlan if present on old resources where pricingPlan is configurable
  context.amplify.updateamplifyMetaAfterResourceUpdate(category, parameters.name, 'pricingPlan', undefined);
  context.amplify.updateBackendConfigAfterResourceUpdate(category, parameters.name, 'pricingPlan', undefined);
};

const saveCFNParameters = (
  parameters: Pick<PlaceIndexParameters, 'name' | 'dataProvider' | 'dataSourceIntendedUse' | 'isDefault'>,
): void => {
  const params = {
    authRoleName: {
      Ref: 'AuthRoleName',
    },
    unauthRoleName: {
      Ref: 'UnauthRoleName',
    },
    indexName: parameters.name,
    // eslint-disable-next-line spellcheck/spell-checker
    dataProvider: parameters.dataProvider === DataProvider.Esri ? 'Esri' : 'Here',
    dataSourceIntendedUse: parameters.dataSourceIntendedUse,
    isDefault: parameters.isDefault,
    pricingPlan: undefined,
  };
  updateParametersFile(params, parameters.name, parametersFileName);
};

/**
 * Gives the Place Index resource configurations to be stored in Amplify Meta file
 */
export const constructPlaceIndexMetaParameters = (params: PlaceIndexParameters, authResourceName: string): PlaceIndexMetaParameters => {
  const dependsOnResources = getResourceDependencies(params.groupPermissions, authResourceName);

  const result: PlaceIndexMetaParameters = {
    isDefault: params.isDefault,
    providerPlugin: provider,
    service: ServiceName.PlaceIndex,
    dataProvider: params.dataProvider,
    dataSourceIntendedUse: params.dataSourceIntendedUse,
    accessType: params.accessType,
    dependsOn: dependsOnResources,
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

/**
 * get CurrentPlaceIndex Parameters
 */
export const getCurrentPlaceIndexParameters = async (indexName: string): Promise<Partial<PlaceIndexParameters>> => {
  const currentIndexMetaParameters = (await readResourceMetaParameters(ServiceName.PlaceIndex, indexName)) as PlaceIndexMetaParameters;
  const currentIndexParameters = stateManager.getResourceInputsJson(pathManager.findProjectRoot(),
    category, indexName, { throwIfNotExist: false }) || {};
  return {
    dataProvider: currentIndexMetaParameters.dataProvider,
    dataSourceIntendedUse: currentIndexMetaParameters.dataSourceIntendedUse,
    accessType: currentIndexMetaParameters.accessType,
    isDefault: currentIndexMetaParameters.isDefault,
    groupPermissions: currentIndexParameters?.groupPermissions || [],
  };
};

/**
 * get PlaceIndex Iam Policies
 */
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
        actions.add('geo:GetPlace');
        break;
      case 'delete':
        actions.add('geo:DeletePlaceIndex');
        break;
      default:
        break;
    }
  });

  const placeIndexPolicy = {
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
