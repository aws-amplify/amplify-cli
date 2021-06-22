import _ from 'lodash';
import inquirer from 'inquirer';
import { merge } from '../utils/resourceParamsUtils';
import { HereMapStyleType, MapParameters, EsriMapStyleType, getMapStyleComponents } from '../utils/mapParams';
import uuid from 'uuid';
import { AccessType, DataProvider, PricingPlan } from '../utils/resourceParams';
import { apiDocs, ServiceName } from '../utils/constants';
import { $TSContext } from 'amplify-cli-core';

/**
 * Starting point for CLI walkthrough that generates a map resource
 * @param context The Amplify Context object
 * @param parameters The configurations of the Map Resource
 */
export async function createMapWalkthrough(
  context: $TSContext,
  parameters: Partial<MapParameters>
): Promise<Partial<MapParameters>> {
  // get the map name
  parameters = merge(parameters, await mapNameWalkthrough(context));

  // get the map data provider
  parameters = merge(parameters, await mapDataProviderWalkthrough(parameters));

  // get the map style parameters
  parameters = merge(parameters, await mapStyleWalkthrough(parameters));

  // get the access
  parameters = merge(parameters, await mapAccessWalkthrough(parameters));

  // get the pricing plan
  parameters = merge(parameters, await pricingPlanWalkthrough(parameters));

  // ask if the map should be set as a default
  parameters.isDefaultMap = await context.amplify.confirmPrompt('Do you want to set this map as default?', true)

  return parameters;
}

async function mapNameWalkthrough(context: any): Promise<Partial<MapParameters>> {
    const mapNamePrompt = {
        type: 'input',
        name: 'mapName',
        message: 'Provide a name for the Map:',
        validate: context.amplify.inputValidation({
            operator: 'regex',
            value: '^[a-zA-Z0-9]+$',
            onErrorMsg: 'You can use the following characters: a-z A-Z 0-9',
            required: true,
        }),
        default: () => {
            const [shortId] = uuid().split('-');
            return `map${shortId}`;
        },
    };
    return await inquirer.prompt([mapNamePrompt]);
}

async function mapDataProviderWalkthrough(parameters: Partial<MapParameters>): Promise<Partial<MapParameters>> {
    const dataProviderPrompt = {
        type: 'list',
        name: 'dataProvider',
        message: 'Specify the data provider of geospatial data:',
        choices: Object.keys(DataProvider),
        default: parameters.dataProvider ? parameters.dataProvider : 'Esri'
    };
    return await inquirer.prompt([dataProviderPrompt]);
}

async function mapStyleTypeWalkthrough(parameters: Partial<MapParameters>): Promise<Partial<MapParameters>> {
    const mapStyleTypePrompt = {
        type: 'list',
        name: 'mapStyleType',
        message: `Specify the map style. Refer ${apiDocs.mapStyles}`,
        choices: Object.keys(EsriMapStyleType),
        default: parameters.mapStyleType ? parameters.mapStyleType : 'Streets'
    };
    return await inquirer.prompt([mapStyleTypePrompt]);
}

async function mapAccessWalkthrough(parameters: Partial<MapParameters>): Promise<Partial<MapParameters>> {
    const mapAccessPrompt = {
        type: 'list',
        name: 'accessType',
        message: 'Who should have access?',
        choices: Object.keys(AccessType),
        default: parameters.accessType ? parameters.accessType : 'AuthorizedUsers'
    };
    return await inquirer.prompt([mapAccessPrompt]);
}

async function pricingPlanWalkthrough(parameters: Partial<MapParameters>): Promise<Partial<MapParameters>> {
    const pricingPlanPrompt = {
        type: 'list',
        name: 'pricingPlan',
        message: 'Specify the pricing plan for the map: Refer https://aws.amazon.com/location/pricing/',
        choices: Object.values(PricingPlan),
        default: parameters.pricingPlan ? parameters.pricingPlan : 'RequestBasedUsage'
    };
    return await inquirer.prompt([pricingPlanPrompt]);
}

async function mapStyleWalkthrough(parameters:Partial<MapParameters>): Promise<Partial<MapParameters>> {
    let params: Partial<MapParameters> = parameters;
    if (params.dataProvider == DataProvider.Here) {
        // single style supported for Here Maps
        params.mapStyleType = HereMapStyleType.Berlin;
    }
    else {
        // get the Esri map style type
        params = merge(params, await mapStyleTypeWalkthrough(parameters));
    }
    return params;
}


/**
 * Starting point for CLI walkthrough that updates a map resource
 * @param context The Amplify Context object
 * @param resourceToUpdate Name of the Map resource to update
 */
export async function updateMapWalkthrough(context: $TSContext, parameters?: Partial<MapParameters>, resourceToUpdate?: string) {
    const mapResources = ((await context.amplify.getResourceStatus()).allResources as any[])
    .filter(resource => resource.service === ServiceName.Map)

    const mapResourceNames = mapResources.map(resource => resource.resourceName);

    if (mapResources.length === 0) {
        context.print.error('No Map resource to update. Use "amplify add geo" to create a new Map.');
        return;
    }

    if (resourceToUpdate) {
        if (!mapResourceNames.includes(resourceToUpdate)) {
        context.print.error(`No Map named ${resourceToUpdate} exists in the project.`);
        return;
        }
    } else {
        const resourceQuestion = [
            {
                name: 'resourceName',
                message: 'Select the Map you want to update',
                type: 'list',
                choices: mapResourceNames,
            }
        ];
        resourceToUpdate = (await inquirer.prompt(resourceQuestion)).resourceName as string;
    }

    parameters.mapName = resourceToUpdate;
    parameters = merge(parameters, await mapAccessWalkthrough(parameters));

    // ask if the map should be set as a default
    parameters.isDefaultMap = await context.amplify.confirmPrompt('Do you want to set this map as default?', true)

    return parameters;
}
