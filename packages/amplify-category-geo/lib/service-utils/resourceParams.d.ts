import { ProviderContext } from '@aws-amplify/amplify-cli-core';
export type ResourceParameters = {
    providerContext: ProviderContext;
    name: string;
    accessType: AccessType;
    isDefault: boolean;
    dataProvider: DataProvider;
};
export declare enum AccessType {
    AuthorizedUsers = "AuthorizedUsers",
    AuthorizedAndGuestUsers = "AuthorizedAndGuestUsers",
    CognitoGroups = "CognitoGroups"
}
export declare enum DataProvider {
    Esri = "Esri",
    Here = "HERE",
    OpenData = "OpenData"
}
//# sourceMappingURL=resourceParams.d.ts.map