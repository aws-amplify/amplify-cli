"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importMessages = void 0;
const chalk_1 = __importDefault(require("chalk"));
exports.importMessages = {
    NoUserPoolsInRegion: (region) => `No Cognito User Pools were found in the configured region: ${region}.`,
    OneUserPoolNotValid: (userPoolId) => `Only one Cognito User Pool '${userPoolId}' found, but it does not meet the requirements for import:`,
    OneUserPoolValid: (userPoolId) => `${greenCheck} Only one Cognito User Pool (${userPoolId}) found and it was automatically selected.`,
    MultipleAppClients: (type) => `The User Pool has multiple ${type} app clients configured.`,
    SingleAppClientSelected: (type, appClientName) => `${greenCheck} Only one ${type} app client found: '${appClientName}' was automatically selected.`,
    NoOAuthConfigurationOnAppClients: () => `${greenCheck} Federated identity providers are not configured, no OAuth configuration needed.`,
    UserPoolOnlySuccess: (userPoolName) => `✅ Cognito User Pool '${userPoolName}' was successfully imported.`,
    UserPoolAndIdentityPoolSuccess: (userPoolName, identityPoolName) => `✅ Cognito User Pool '${userPoolName}' and Identity Pool '${identityPoolName}' was successfully imported.`,
    UserPoolValidation: (userPoolName, userPoolId) => `The previously configured Cognito User Pool: '${userPoolName}' (${userPoolId}) configuration is invalid.`,
    UserPoolNotFound: (userPoolName, userPoolId) => `The previously configured Cognito User Pool: '${userPoolName}' (${userPoolId}) cannot be found.`,
    IdentityPoolNotFound: (identityPoolName, identityPoolId) => `The previously configured Identity Pool: '${identityPoolName}' (${identityPoolId}) cannot be found.`,
    AppClientNotFound: (type, clientId) => `The previously configured ${type} app client cannot be found.`,
    NoAtLeastOneAppClient: (type) => `The selected Cognito User Pool does not have at least 1 ${type} app client configured. ${type} app clients are app clients ${type === 'Web' ? 'without' : 'with'} a client secret.`,
    OneIdentityPoolValid: (identityPoolName, identityPoolId) => `${greenCheck} Only one Identity Pool resource found: '${identityPoolName}' (${identityPoolId}) was automatically selected.`,
    MultipleIdentityPools: ` Multiple Identity Pools are configured for the selected Cognito User Pool.`,
    NoIdentityPoolsFoundWithSelectedUserPool: `There are no Identity Pools found which has the selected Cognito User Pool configured as identity provider.`,
    NoIdentityPoolsForSelectedAppClientsFound: `There are no Identity Pools found which has the selected app clients configured as identity providers.`,
    NewEnvDifferentRegion: (resourceName, currentEnvRegion, newEnvRegion) => `The previously imported '${resourceName}' auth resource was imported from '${currentEnvRegion}' region and the new environment's region is: '${newEnvRegion}', import a new resource to finish the creation of the new environment.`,
    NoClientInUserPool: (userPoolId, type, clientId) => `No ${type} app client with Client Id: '${clientId}' can be found in User Pool: '${userPoolId}'.`,
    ImportPreviousResourceFooter: `If you choose No, then an import walkthrough will run to import a different resource into the new environment.`,
    ImportNewResourceRequired: (resourceName) => `Imported resource: '${resourceName}' found, parameters are required for environment creation.`,
    ConfirmUseDifferentAppClient: 'It is recommended to use different app clients for web and native application, You have chosen the same app client for both. Do you want to change this?',
    WarnAppClientReuse: '⚠️ It is recommended to use different app client for web and native application.',
    Questions: {
        UserPoolSelection: 'Select the User Pool you want to import:',
        IdentityPoolSelection: `Select the Identity Pool you want to import:`,
        AutoCompleteFooter: '(Type in a partial name or scroll up and down to reveal more choices)',
        AppClientValidation: `The selected Cognito User Pool does not have at least 1 web and 1 native app client configured. Web app clients are app clients without a client secret. Native app clients have a client secret.`,
        SelectAppClient: (type) => `Select a ${type} client to import:`,
        ImportPreviousResource: (resourceName, userPoolId, envName) => `The resource: '${resourceName}' (Cognito User Pool: '${userPoolId}') already imported to '${envName}' environment, do you want to import it to the new environment?`,
    },
    OAuth: {
        NoCommonProvidersFound: 'There are no common OAuth providers for the selected app clients.',
        SelectNewAppClients: 'Select new app clients',
        SomePropertiesAreNotMatching: 'The following OAuth properties are not matching:',
        ConfiguredIdentityProviders: 'Configured Identity Providers:',
        OAuthFlowEnabledForApplicationClient: 'OAuth Flow Enabled for app client:',
        CallbackURLs: 'Callback URLs:',
        LogoutURLs: 'Logout URLs:',
        AllowedOAuthFlows: 'Allowed OAuth Flows:',
        AllowedOAuthScopes: 'Allowed OAuth Scopes:',
        PropertiesAreNotMatching: 'OAuth properties for the app clients are not matching.',
    },
};
const greenCheck = chalk_1.default.green('✔');
//# sourceMappingURL=messages.js.map