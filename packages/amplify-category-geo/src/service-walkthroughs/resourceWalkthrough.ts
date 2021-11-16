import { AccessType, DataProvider, ResourceParameters } from "../service-utils/resourceParams";
import { ServiceName, choosePricingPlan, apiDocs } from "../service-utils/constants";
import { PricingPlan } from "../service-utils/resourceParams";
import { $TSContext, open } from "amplify-cli-core";
import { printer, prompter } from 'amplify-prompts';

export async function authAndGuestAccessWalkthrough<T extends ResourceParameters>(
    parameters: Partial<T>,
    service: ServiceName
): Promise<Partial<T>> {
    const accessChoices = [
        { name: 'Authorized users only', value: AccessType.AuthorizedUsers },
        { name: 'Authorized and Guest users', value: AccessType.AuthorizedAndGuestUsers }
    ];
    let accessTypeDefaultIndex = 0;
    if (parameters.accessType === AccessType.AuthorizedAndGuestUsers) {
        accessTypeDefaultIndex = 1;
    }

    parameters.accessType = await prompter.pick<'one', string>(
        `Who can access this ${getServiceFriendlyName(service)}?`,
        accessChoices,
        { initial: accessTypeDefaultIndex }
    ) as AccessType;
    return parameters;
};

export async function pricingPlanWalkthrough<T extends ResourceParameters>(
    context: $TSContext,
    parameters: Partial<T>,
    extendedFlow?: boolean
): Promise<Partial<T>> {
    let pricingPlan: PricingPlan = parameters.pricingPlan ? parameters.pricingPlan : PricingPlan.RequestBasedUsage;

    printer.info(choosePricingPlan);

    const pricingPlanBusinessTypeChoices = [
        { name: "No, I do not track or direct any assets", value: PricingPlan.RequestBasedUsage },
        { name: "No, I only need to track or direct consumers' personal mobile devices", value: PricingPlan.RequestBasedUsage },
        { name: 'Yes, I track or direct commercial assets (For example, any mobile object that is tracked by a company in support of its business)', value: 'Unknown' },
        { name: 'Learn More', value: 'LearnMore'}
    ];

    const pricingPlanChoiceDefaultIndex = pricingPlan === PricingPlan.RequestBasedUsage ? 0 : 2;
    const assetsQuestion = 'Are you tracking or directing commercial assets for your business in your app?';

    let pricingPlanBusinessTypeChoice = await prompter.pick<'one', string>(
        assetsQuestion,
        pricingPlanBusinessTypeChoices,
        { initial: pricingPlanChoiceDefaultIndex }
    );
    while (pricingPlanBusinessTypeChoice === 'LearnMore') {
        open(apiDocs.pricingPlan, { wait: false });
        pricingPlanBusinessTypeChoice = await prompter.pick<'one', string>(
            assetsQuestion,
            pricingPlanBusinessTypeChoices,
            { initial: pricingPlanChoiceDefaultIndex }
        );
    }

    if (pricingPlanBusinessTypeChoice === PricingPlan.RequestBasedUsage) {
        pricingPlan = PricingPlan.RequestBasedUsage;
    }
    else {
        let mapsSearchUsability = true;
        if (extendedFlow === true) {
            mapsSearchUsability = await prompter.yesOrNo(
                'Does your app need Maps, Location Search or Routing?',
                pricingPlan !== PricingPlan.RequestBasedUsage
            )
        }
        if (mapsSearchUsability === true) {
            const pricingPlanRoutingChoice = await prompter.yesOrNo(
                'Does your app provide routing or route optimization for commercial assets?',
                pricingPlan === PricingPlan.MobileAssetManagement ? true : false
            );
            pricingPlan = pricingPlanRoutingChoice ? PricingPlan.MobileAssetManagement : PricingPlan.MobileAssetTracking;
        }
        else {
            const pricingPlanChoices = [
                { name: 'Request Based Usage', value: PricingPlan.RequestBasedUsage },
                { name: 'Mobile Asset Tracking', value: PricingPlan.MobileAssetTracking },
                { name: 'Mobile Asset Management', value: PricingPlan.MobileAssetManagement },
                { name: 'Learn More', value: 'LearnMore'}
            ];
            const pricingPlanQuestion = "Based on your use case, you may use any of the pricing plans. Select the pricing plan for ALL your Geo resources in the project. We recommend you start with 'Request Based Usage' and then consider one of the other pricing plans as your usage scales";

            let pricingPlanChoice = await prompter.pick<'one', string>(
                pricingPlanQuestion,
                pricingPlanChoices,
                { initial: 0 }
            );
            while (pricingPlanChoice === 'LearnMore') {
                open(apiDocs.pricingPlan, { wait: false });
                pricingPlanChoice = await prompter.pick<'one', string>(
                    pricingPlanQuestion,
                    pricingPlanChoices,
                    { initial: 0 }
                );
            }

            pricingPlan = pricingPlanChoice as PricingPlan;
        }
    }
    parameters.pricingPlan = pricingPlan;

    printer.info(`Successfully set ${pricingPlan} pricing plan for your Geo resources.`);
    return parameters;
};

export async function dataProviderWalkthrough<T extends ResourceParameters>(
    parameters: Partial<T>,
    service: ServiceName
): Promise<Partial<T>> {
    let dataProviderPrompt = `Specify the data provider of geospatial data for this ${getServiceFriendlyName(service)}:`;
    if (service === ServiceName.GeofenceCollection) {
        dataProviderPrompt = `Specify the data provider for ${getServiceFriendlyName(service)}. This will be only used to calculate billing.`;
    }
    const dataProviderInput = await prompter.pick<'one', string>(
        dataProviderPrompt,
        Object.values(DataProvider),
        { initial: (parameters.dataProvider === DataProvider.Here) ? 1 : 0 }
    );
    const provider = (Object.keys(DataProvider).find(key => DataProvider[key as keyof typeof DataProvider] === dataProviderInput)) as DataProvider;
    parameters.dataProvider = provider;
    return parameters;
};

export const getServiceFriendlyName = (service: ServiceName): string => {
    switch(service) {
        case ServiceName.PlaceIndex:
            return 'search index';
        case ServiceName.GeofenceCollection:
            return 'geofence collection';
        default:
            return service;
    }
};

export const defaultResourceQuestion = (service: ServiceName): string => {
    const friendlyServiceName = getServiceFriendlyName(service);
    return `Set this ${friendlyServiceName} as the default? It will be used in Amplify ${friendlyServiceName} API calls if no explicit reference is provided.`;
}
