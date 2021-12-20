import { AccessType, DataProvider, ResourceParameters } from "../service-utils/resourceParams";
import { ServiceName } from "../service-utils/constants";
import { prompter } from 'amplify-prompts';

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
