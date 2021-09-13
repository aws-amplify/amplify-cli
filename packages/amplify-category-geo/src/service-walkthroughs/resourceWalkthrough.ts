import { AccessType, DataProvider, ResourceParameters } from "../service-utils/resourceParams";
import inquirer from "inquirer";
import { ServiceName, choosePricingPlan, apiDocs } from "../service-utils/constants";
import { PricingPlan } from "../service-utils/resourceParams";
import { $TSContext, open } from "amplify-cli-core";
import { printer } from 'amplify-prompts';

export async function resourceAccessWalkthrough<T extends ResourceParameters>(
    parameters: Partial<T>,
    service: ServiceName
): Promise<Partial<T>> {
    const accessChoices = [
        { name: 'Authorized users only', value: AccessType.AuthorizedUsers },
        { name: 'Authorized and Guest users', value: AccessType.AuthorizedAndGuestUsers }
    ];

    const accessPrompt = {
        type: 'list',
        name: 'accessType',
        message: `Who can access this ${getServiceFriendlyName(service)}?`,
        choices: accessChoices,
        default: parameters.accessType ? parameters.accessType : AccessType.AuthorizedUsers
    };
    return await inquirer.prompt([accessPrompt]);
};

export async function pricingPlanWalkthrough<T extends ResourceParameters>(
    context: $TSContext,
    parameters: Partial<T>
): Promise<Partial<T>> {
    let pricingPlan: PricingPlan = parameters.pricingPlan ? parameters.pricingPlan : PricingPlan.RequestBasedUsage;

    printer.info(choosePricingPlan);

    const pricingPlanBusinessTypeChoices = [
        { name: "No, I do not track devices or I only need to track consumers' personal devices", value: PricingPlan.RequestBasedUsage },
        { name: 'Yes, I track commercial assets (For example, any mobile object that is tracked by a company in support of its business)', value: 'Unknown' },
        { name: 'Learn More', value: 'LearnMore'}
    ];
    const pricingPlanBusinessTypePrompt = {
        type: 'list',
        name: 'pricingPlanBusinessType',
        message: 'Are you tracking commercial assets for your business in your app?',
        choices: pricingPlanBusinessTypeChoices,
        default: pricingPlan === PricingPlan.RequestBasedUsage ? PricingPlan.RequestBasedUsage : 'Unknown'
    };

    let pricingPlanBusinessTypeChoice = ((await inquirer.prompt([pricingPlanBusinessTypePrompt])).pricingPlanBusinessType);
    while (pricingPlanBusinessTypeChoice === 'LearnMore') {
        open(apiDocs.pricingPlan, { wait: false });
        pricingPlanBusinessTypeChoice = ((await inquirer.prompt([pricingPlanBusinessTypePrompt])).pricingPlanBusinessType);
    }

    if (pricingPlanBusinessTypeChoice === PricingPlan.RequestBasedUsage) {
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

    printer.info(`Successfully set ${pricingPlan} pricing plan for your Geo resources.`);
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

    const dataProviderInput = (await inquirer.prompt([dataProviderPrompt])).dataProvider;
    const provider = (Object.keys(DataProvider).find(key => DataProvider[key as keyof typeof DataProvider] === dataProviderInput)) as DataProvider;
    parameters.dataProvider = provider;
    return parameters;
};

const getServiceFriendlyName = (service: ServiceName): string => {
    switch(service) {
        case ServiceName.PlaceIndex:
            return 'Search Index';
        default:
            return service;
    }
};
