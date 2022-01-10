import { AccessType, DataProvider, ResourceParameters } from "../service-utils/resourceParams";
import { apiDocs, ServiceName } from "../service-utils/constants";
import { prompter, printer, byValue, byValues } from 'amplify-prompts';
import { $TSContext } from "amplify-cli-core";

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
        { initial: (parameters.dataProvider === DataProvider.Esri) ? 0 : 1 }
    );
    const provider = (Object.keys(DataProvider).find(key => DataProvider[key as keyof typeof DataProvider] === dataProviderInput)) as DataProvider;
    if (provider === DataProvider.Esri) {
        printer.warn(`${DataProvider.Esri} does not support tracking and routing commercial assets. Refer to ${apiDocs.pricingPlan} `);
    }
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
