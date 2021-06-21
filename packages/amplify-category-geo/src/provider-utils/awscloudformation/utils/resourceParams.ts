/**
 * Parameters common to geo resources
 */
export type ResourceParameters = {
    pricingPlan: PricingPlan,
    accessType: AccessType
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
  