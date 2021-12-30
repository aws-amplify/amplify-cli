import { AccessType, DataProvider, ResourceParameters } from "../service-utils/resourceParams";
import { ServiceName, choosePricingPlan, apiDocs } from "../service-utils/constants";
import { PricingPlan } from "../service-utils/resourceParams";
import { $TSContext, open } from "amplify-cli-core";
import { byValue, byValues, printer, prompter } from 'amplify-prompts';

export async function resourceAccessWalkthrough<T extends ResourceParameters & { groupPermissions: string[] }>(
    context: $TSContext,
    parameters: Partial<T>,
    service: ServiceName
): Promise<Partial<T>> {
    let permissionSelected = 'Auth/Guest Users';
    const LearnMore = 'Learn more';
    const userPoolGroupList = context.amplify.getUserPoolGroupList();

    if (userPoolGroupList.length > 0) {
        do {
            if (permissionSelected === LearnMore) {
                printer.info('');
                printer.info(
                    'You can restrict access using CRUD policies for Authenticated Users, Guest Users, or on individual Group that users belong to in a User Pool. If a user logs into your application and is not a member of any group they will use policy set for “Authenticated Users”, however if they belong to a group they will only get the policy associated with that specific group.',
                );
                printer.info('');
            }
            let defaultPermission = 'Auth/Guest Users';
            if (parameters.accessType === AccessType.CognitoGroups) {
                defaultPermission = 'Individual Groups'
            }
            else if (parameters.groupPermissions && 
                parameters.groupPermissions.length > 0 && 
                parameters.accessType !== AccessType.CognitoGroups) {
                defaultPermission = 'Both'
            }
            permissionSelected = await prompter.pick<'one', string>(
                `Restrict access by?`,
                ['Auth/Guest Users', 'Individual Groups', 'Both', LearnMore],
                { initial: byValue(defaultPermission) }
            );
        } while (permissionSelected === 'Learn more');
    }

    if (permissionSelected === 'Both' || permissionSelected === 'Auth/Guest Users') {
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

        if (permissionSelected === 'Auth/Guest Users') {
            parameters.groupPermissions = [];
        }
    }

    if (permissionSelected === 'Both' || permissionSelected === 'Individual Groups') {
        let defaultSelectedGroups: string[] = [];
        if (parameters.groupPermissions) {
            defaultSelectedGroups = parameters.groupPermissions;
        }

        const selectedUserPoolGroups = await prompter.pick<'many', string>(
            'Select one or more cognito groups to give access:',
            userPoolGroupList,
            { returnSize: 'many', initial: byValues(defaultSelectedGroups) }
        );

        if(typeof selectedUserPoolGroups === 'string') {
            parameters.groupPermissions = [selectedUserPoolGroups];
        }
        else {
            parameters.groupPermissions = selectedUserPoolGroups;
        }

        if (permissionSelected === 'Individual Groups') {
            parameters.accessType = AccessType.CognitoGroups;
        }
    }
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
