import { DataSourceIntendedUse, PlaceIndexParameters } from '../utils/placeIndexParams';
import { $TSContext } from 'amplify-cli-core';
import { merge } from '../utils/resourceParamsUtils';
import uuid from 'uuid';
import inquirer from 'inquirer';
import { AccessType, DataProvider, PricingPlan } from '../utils/resourceParams';

/**
 * Starting point for CLI walkthrough that generates a place index resource
 * @param context The Amplify Context object
 * @param parameters The configurations of the Place Index Resource
 */
 export async function createPlaceIndexWalkthrough(
  context: $TSContext,
): Promise<Partial<PlaceIndexParameters>> {
  let parameters : Partial<PlaceIndexParameters>  = {};
  // get the place index name
  parameters = merge(parameters, await placeIndexNameWalkthrough(context));
  // get the data provider
  parameters = merge(parameters, await placeIndexDataProviderWalkthrough(parameters));
  // get the access
  parameters = merge(parameters, await placeIndexAccessWalkthrough(parameters));
  // ask if the place index should be set as a default
  parameters.isDefaultPlaceIndex = await context.amplify.confirmPrompt('Do you want to set this place index as default?\nIt will be used in Amplify Search API calls if no explicit place index reference is provided?', true)
  // ask if advanced config is needed
  if (await context.amplify.confirmPrompt('Do you want to configure advanced settings?', false)) {
    console.log('advanced');
    // get the data storage
    parameters = merge(parameters, await placeIndexStorageWalkthrough(parameters))
    // get the pricing plan
    parameters = merge(parameters, await placeIndexPricingWalkthrough(parameters))
  }
  return parameters;
}

/**
 * Starting point for CLI walkthrough that updates a place index resource
 * @param context The Amplify Context object
 * @param placeIndexToUpdate Name of the Map resource to update
 */
 export async function updatePlaceIndexWalkthrough(context: $TSContext) {
  context.print.info('update place index walkthrough');
}

/**
 * Starting point for CLI walkthrough that removes a place index resource
 * @param context The Amplify Context object
 * @param placeIndexToRemove Name of the Map resource to update
 */
 export async function removePlaceIndexWalkthrough(context: $TSContext) {
  context.print.info('remove place index walkthrough');
}

async function placeIndexNameWalkthrough(context: $TSContext): Promise<Pick<PlaceIndexParameters, 'placeIndexName'>> {
  const placeIndexNamePrompt = {
    type: 'input',
    name: 'placeIndexName',
    message: 'Provide a name for the place index:',
    validate: context.amplify.inputValidation({
        operator: 'regex',
        value: '^[a-zA-Z0-9]+$',
        onErrorMsg: 'You can use the following characters: a-z A-Z 0-9',
        required: true,
    }),
    default: () => {
        const [shortId] = uuid().split('-');
        return `placeindex${shortId}`;
    },
  };
  return await inquirer.prompt([placeIndexNamePrompt]);
}

async function placeIndexDataProviderWalkthrough(parameters: Partial<PlaceIndexParameters>): Promise<Pick<PlaceIndexParameters, 'dataProvider'>> {
  const dataProviderPrompt = {
      type: 'list',
      name: 'dataProvider',
      message: 'Specify the data provider of geospatial data:',
      choices: Object.keys(DataProvider),
      default: parameters.dataProvider || 'Esri'
  };
  return await inquirer.prompt([dataProviderPrompt]);
}

async function placeIndexAccessWalkthrough(parameters: Partial<PlaceIndexParameters>): Promise<Pick<PlaceIndexParameters, 'accessType'>> {
  const placeIndexAccessPrompt = {
      type: 'list',
      name: 'accessType',
      message: 'Who should have access?',
      choices: [
        {
          name: "Authorized users only",
          value: AccessType.AuthorizedUsers
        },
        {
          name: "Authorized and Guest users",
          value: AccessType.AuthorizedAndGuestUsers
        }
      ],
      default: parameters.accessType || 'AuthorizedUsers'
  };
  return await inquirer.prompt([placeIndexAccessPrompt]);
}

async function placeIndexStorageWalkthrough(parameters: Partial<PlaceIndexParameters>): Promise<Pick<PlaceIndexParameters, 'dataSourceIntendedUse'>> {
  const dataStoragePrompt = {
      type: 'list',
      name: 'dataSourceIntendedUse',
      message: 'Specify the data storage option for requesting Places. Refer <API doc>',
      choices: [
        {
          name: "Single Use",
          value: DataSourceIntendedUse.SingleUse
        },
        {
          name: "Storage",
          value: DataSourceIntendedUse.Storage
        }
      ],
      default: parameters.dataSourceIntendedUse || DataSourceIntendedUse.SingleUse
  };
  return await inquirer.prompt([dataStoragePrompt]);
}

async function placeIndexPricingWalkthrough(parameters: Partial<PlaceIndexParameters>): Promise<Pick<PlaceIndexParameters, 'pricingPlan'>> {
  const pricingPrompt = {
      type: 'list',
      name: 'pricingPlan',
      message: 'Specify the pricing plan for the place index. Refer <pricing doc>?',
      choices: [
        {
          name: "Request-based Usage",
          value: PricingPlan.RequestBasedUsage
        },
        {
          name: "Mobile Asset Tracking",
          value: PricingPlan.MobileAssetTracking
        },
        {
          name: "Mobile Asset Management",
          value: PricingPlan.MobileAssetManagement        
        }
      ],
      default: parameters.pricingPlan || PricingPlan.RequestBasedUsage
  };
  return await inquirer.prompt([pricingPrompt]);
}