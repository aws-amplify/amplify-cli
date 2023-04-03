export declare const importMessages: {
    NoUserPoolsInRegion: (region: string) => string;
    OneUserPoolNotValid: (userPoolId: string) => string;
    OneUserPoolValid: (userPoolId: string) => string;
    MultipleAppClients: (type: 'Web' | 'Native') => string;
    SingleAppClientSelected: (type: 'Web' | 'Native', appClientName: string) => string;
    NoOAuthConfigurationOnAppClients: () => string;
    UserPoolOnlySuccess: (userPoolName: string) => string;
    UserPoolAndIdentityPoolSuccess: (userPoolName: string, identityPoolName: string) => string;
    UserPoolValidation: (userPoolName: string, userPoolId: string) => string;
    UserPoolNotFound: (userPoolName: string, userPoolId: string) => string;
    IdentityPoolNotFound: (identityPoolName: string, identityPoolId: string) => string;
    AppClientNotFound: (type: 'Web' | 'Native', clientId: string) => string;
    NoAtLeastOneAppClient: (type: 'Web' | 'Native') => string;
    OneIdentityPoolValid: (identityPoolName: string, identityPoolId: string) => string;
    MultipleIdentityPools: string;
    NoIdentityPoolsFoundWithSelectedUserPool: string;
    NoIdentityPoolsForSelectedAppClientsFound: string;
    NewEnvDifferentRegion: (resourceName: string, currentEnvRegion: string, newEnvRegion: string) => string;
    NoClientInUserPool: (userPoolId: string, type: 'Web' | 'Native', clientId: string) => string;
    ImportPreviousResourceFooter: string;
    ImportNewResourceRequired: (resourceName: string) => string;
    ConfirmUseDifferentAppClient: string;
    WarnAppClientReuse: string;
    Questions: {
        UserPoolSelection: string;
        IdentityPoolSelection: string;
        AutoCompleteFooter: string;
        AppClientValidation: string;
        SelectAppClient: (type: 'Web' | 'Native') => string;
        ImportPreviousResource: (resourceName: string, userPoolId: string, envName: string) => string;
    };
    OAuth: {
        NoCommonProvidersFound: string;
        SelectNewAppClients: string;
        SomePropertiesAreNotMatching: string;
        ConfiguredIdentityProviders: string;
        OAuthFlowEnabledForApplicationClient: string;
        CallbackURLs: string;
        LogoutURLs: string;
        AllowedOAuthFlows: string;
        AllowedOAuthScopes: string;
        PropertiesAreNotMatching: string;
    };
};
//# sourceMappingURL=messages.d.ts.map