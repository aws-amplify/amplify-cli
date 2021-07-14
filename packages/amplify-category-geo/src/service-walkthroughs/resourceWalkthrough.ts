import { AccessType, DataProvider, ResourceParameters } from "../service-utils/resourceParams";
import inquirer from "inquirer";
import { apiDocs, ServiceName } from "../service-utils/constants";
import { PricingPlan } from "../service-utils/resourceParams";

export async function resourceAccessWalkthrough<T extends ResourceParameters>(
    parameters: Partial<T>,
    service: ServiceName
): Promise<Partial<T>> {
    const indexAccessPrompt = {
        type: 'list',
        name: 'accessType',
        message: `Who can access this ${getServiceFriendlyName(service)}?`,
        choices: Object.keys(AccessType),
        default: parameters.accessType ? parameters.accessType : 'AuthorizedUsers'
    };
    return await inquirer.prompt([indexAccessPrompt]);
};

export async function pricingPlanWalkthrough<T extends ResourceParameters>(
    parameters: Partial<T>,
    service: ServiceName
): Promise<Partial<T>> {
    const pricingPlanPrompt = {
        type: 'list',
        name: 'pricingPlan',
        message: `Specify the pricing plan for this ${getServiceFriendlyName(service)}. Refer ${apiDocs.pricingPlan}:`,
        choices: Object.values(PricingPlan),
        default: parameters.pricingPlan ? parameters.pricingPlan : 'RequestBasedUsage'
    };
    return await inquirer.prompt([pricingPlanPrompt]);
};

export async function dataProviderWalkthrough<T extends ResourceParameters>(
    parameters: Partial<T>,
    service: ServiceName
): Promise<Partial<T>> {
    const dataProviderPrompt = {
        type: 'list',
        name: 'dataProvider',
        message: `Specify the data provider of geospatial data for this ${getServiceFriendlyName(service)}:`,
        choices: Object.values(DataProvider),
        default: parameters.dataProvider ? parameters.dataProvider : 'Esri'
    };
    return await inquirer.prompt([dataProviderPrompt]);
};

const getServiceFriendlyName = (service: ServiceName): string => {
    switch(service) {
        case ServiceName.PlaceIndex:
            return 'Search Index';
        default:
            return service;
    }
};