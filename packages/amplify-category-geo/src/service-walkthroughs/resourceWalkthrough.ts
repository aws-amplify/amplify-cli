import { AccessType, DataProvider, ResourceParameters } from "../service-utils/resourceParams";
import { apiDocs, ServiceName } from "../service-utils/constants";
import { $TSContext, open } from "amplify-cli-core";
import { printer, prompter } from 'amplify-prompts';

export async function resourceAccessWalkthrough<T extends ResourceParameters>(
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
    const dataProviderInput = await prompter.pick<'one', string>(
        `Specify the data provider of geospatial data for this ${getServiceFriendlyName(service)}:`,
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
        default:
            return service;
    }
};

export const defaultResourceQuestion = (service: ServiceName): string => {
    const friendlyServiceName = getServiceFriendlyName(service);
    return `Set this ${friendlyServiceName} as the default? It will be used in Amplify ${friendlyServiceName} API calls if no explicit reference is provided.`;
}
