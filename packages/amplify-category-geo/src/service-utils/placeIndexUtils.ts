import { $TSContext, $TSObject } from 'amplify-cli-core';
import { PlaceIndexParameters } from './placeIndexParams';
import _ from 'lodash';
import { parametersFileName, provider, ServiceName } from './constants';
import { category } from '../constants';
import { PlaceIndexStack } from '../service-stacks/placeIndexStack';
import { updateParametersFile, generateTemplateFile, updateDefaultResource, readResourceMetaParameters } from './resourceUtils';
import { App } from '@aws-cdk/core';

export const createPlaceIndexResource = async (context: $TSContext, parameters: PlaceIndexParameters) => {
  // generate CFN files
  const placeIndexStack = new PlaceIndexStack(new App(), 'PlaceIndexStack', parameters);
  generateTemplateFile(placeIndexStack, parameters.name);
  saveCFNParameters(parameters);

  const placeIndexMetaParameters = constructPlaceIndexMetaParameters(parameters);

  // update the default place index
  if (parameters.isDefault) {
    // remove the previous default place index
    await updateDefaultResource(context, ServiceName.PlaceIndex);
  }

  context.amplify.updateamplifyMetaAfterResourceAdd(
    category,
    parameters.name,
    placeIndexMetaParameters
  );
};

export const modifyPlaceIndexResource = async (
  context: $TSContext,
  parameters: Pick<PlaceIndexParameters, 'accessType' | 'name' | 'isDefault'>
  ) => {
  // generate CFN files
  const placeIndexStack = new PlaceIndexStack(new App(), 'PlaceIndexStack', parameters);
  generateTemplateFile(placeIndexStack, parameters.name);

  // update the default place index
  if (parameters.isDefault) {
    await updateDefaultResource(context, ServiceName.PlaceIndex , parameters.name);
  }

  const paramsToUpdate = ['accessType'];
  paramsToUpdate.forEach(param => {
    context.amplify.updateamplifyMetaAfterResourceUpdate(
      category,
      parameters.name,
      param,
      (parameters as $TSObject)[param]
    );
  });
};

function saveCFNParameters(
  parameters: Pick<PlaceIndexParameters, 'name'  | 'dataProvider' | 'dataSourceIntendedUse' | 'pricingPlan'>
) {
    const params = {
      authRoleName: {
        "Ref": "AuthRoleName"
      },
      unauthRoleName: {
        "Ref": "UnauthRoleName"
      },
      indexName: parameters.name,
      dataProvider: parameters.dataProvider,
      dataSourceIntendedUse: parameters.dataSourceIntendedUse,
      pricingPlan: parameters.pricingPlan
    };
    updateParametersFile(params, parameters.name, parametersFileName);
}

/**
 * Gives the Place Index resource configurations to be stored in Amplify Meta file
 */
export const constructPlaceIndexMetaParameters = (params: PlaceIndexParameters): PlaceIndexMetaParameters => {
  let result: PlaceIndexMetaParameters = {
    isDefault: params.isDefault,
    providerPlugin: provider,
    service: ServiceName.PlaceIndex,
    dataProvider: params.dataProvider,
    dataSourceIntendedUse: params.dataSourceIntendedUse,
    pricingPlan: params.pricingPlan,
    accessType: params.accessType
  };
  return result;
};

/**
 * The Meta information stored for a Place Index Resource
 */
export type PlaceIndexMetaParameters = Pick<PlaceIndexParameters,
    'isDefault' | 'pricingPlan' | 'accessType' |
    'dataSourceIntendedUse' | 'dataProvider'> & {
  providerPlugin: string;
  service: string;
}

export const getCurrentPlaceIndexParameters = async (indexName: string): Promise<Partial<PlaceIndexParameters>> => {
  const currentIndexMetaParameters = await readResourceMetaParameters(ServiceName.PlaceIndex, indexName) as PlaceIndexMetaParameters;
  return {
    dataProvider: currentIndexMetaParameters.dataProvider,
    dataSourceIntendedUse: currentIndexMetaParameters.dataSourceIntendedUse,
    pricingPlan: currentIndexMetaParameters.pricingPlan,
    accessType: currentIndexMetaParameters.accessType,
    isDefault: currentIndexMetaParameters.isDefault
  };
};
