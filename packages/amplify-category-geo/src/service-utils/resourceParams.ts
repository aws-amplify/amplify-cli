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

/**
 * higher level context
 */
export interface ProviderContext {
    provider: string;
    service: string;
    projectName: string;
}

export enum PricingPlan {
    RequestBasedUsage = "RequestBasedUsage",
    MobileAssetTracking = "MobileAssetTracking",
    MobileAssetManagement = "MobileAssetManagement"
}

export enum AccessType {
    AuthorizedUsers = "AuthorizedUsers",
    AuthorizedAndGuestUsers = "AuthorizedAndGuestUsers"
}

export enum DataProvider {
    Esri = "Esri",
    Here = "Here"
}
