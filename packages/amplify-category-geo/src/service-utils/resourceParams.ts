import { ProviderContext } from 'amplify-cli-core';

/**
 * Parameters common to geo resources
 */
export type ResourceParameters = {
    providerContext: ProviderContext,
    name: string,
    pricingPlan: PricingPlan,
    accessType: AccessType,
    isDefault: boolean,
    dataProvider: DataProvider
}

export enum PricingPlan {
    RequestBasedUsage = 'RequestBasedUsage',
    MobileAssetTracking = 'MobileAssetTracking',
    MobileAssetManagement = 'MobileAssetManagement'
}

export enum AccessType {
    AuthorizedUsers = 'AuthorizedUsers',
    AuthorizedAndGuestUsers = 'AuthorizedAndGuestUsers',
    CognitoGroups = 'CognitoGroups'
}

export enum DataProvider {
    Esri = 'Esri',
    Here = 'HERE'
}
