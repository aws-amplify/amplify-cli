import { AccessType, DataProvider, ResourceParameters } from "../service-utils/resourceParams";
import inquirer from "inquirer";
import { ServiceName, choosePricingPlan } from "../service-utils/constants";
import { PricingPlan } from "../service-utils/resourceParams";
import { $TSContext } from "amplify-cli-core";

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
    context: $TSContext,
    parameters: Partial<T>
): Promise<Partial<T>> {
    let pricingPlan: PricingPlan = parameters.pricingPlan ? parameters.pricingPlan : PricingPlan.RequestBasedUsage;

    context.print.info(choosePricingPlan);

    const pricingPlanBusinessTypeChoices = [
        { name: 'No, I only need to track consumers personal mobile devices', value: YesOrNo.No },
        { name: 'Yes, I track commercial assets (For example, any mobile object that is tracked by a company in support of its business)', value: YesOrNo.Yes }
    ];
    const pricingPlanBusinessTypePrompt = {
        type: 'list',
        name: 'pricingPlanBusinessType',
        message: 'Are you tracking commercial assets for your business?',
        choices: pricingPlanBusinessTypeChoices,
        default: pricingPlan === PricingPlan.RequestBasedUsage ? YesOrNo.No : YesOrNo.Yes
    };

    const pricingPlanBusinessTypeChoice = ((await inquirer.prompt([pricingPlanBusinessTypePrompt])).pricingPlanBusinessType as YesOrNo);
    if (pricingPlanBusinessTypeChoice === YesOrNo.No) {
        pricingPlan = PricingPlan.RequestBasedUsage;
    }
    else {
        const pricingPlanRoutingChoice = await context.amplify.confirmPrompt(
            'Does your app provide routing or route optimization for commercial assets?',
            pricingPlan === PricingPlan.MobileAssetManagement ? true : false
        );
        pricingPlan = pricingPlanRoutingChoice ? PricingPlan.MobileAssetManagement : PricingPlan.MobileAssetTracking;
    }
    parameters.pricingPlan = pricingPlan;

    context.print.info(`Successfully set ${pricingPlan} pricing plan for your Geo resources.`);
    return parameters;
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

export const enum YesOrNo {
    Yes = 'Yes',
    No = 'No'
}