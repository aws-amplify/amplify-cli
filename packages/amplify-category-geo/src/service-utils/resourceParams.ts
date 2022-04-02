import { ProviderContext } from 'amplify-cli-core';

/**
 * Parameters common to geo resources
 */
export type ResourceParameters = {
    providerContext: ProviderContext,
    name: string,
    accessType: AccessType,
    isDefault: boolean,
    dataProvider: DataProvider
}

export enum AccessType {
    AuthorizedUsers = 'AuthorizedUsers',
    AuthorizedAndGuestUsers = 'AuthorizedAndGuestUsers'
}

export enum DataProvider {
    Esri = 'Esri',
    Here = 'Here'
}
