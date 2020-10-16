import chalk from 'chalk';

export const importMessages = {
  NoUserPoolsInRegion: (region: string) => `No Cognito User Pools were found in the configured region: ${region}.`,
  OneUserPoolNotValid: (userPoolId: string) =>
    `Only one Cognito User Pool '${userPoolId}' found, but it does not meet the requirements for import:`,
  OneUserPoolValid: (userPoolId: string) =>
    `${greenCheck} Only one Cognito User Pool (${userPoolId}) found and it was automatically selected.`,
  MultipleAppClients: (type: 'Web' | 'Native') => `The User Pool has multiple ${type} Application Clients configured.`,
  SingleAppClientSelected: (type: 'Web' | 'Native', appClientName: string) =>
    `${greenCheck} Only one ${type} Application Client found: '${appClientName}' was automatically selected.`,
  NoOAuthConfigurationOnAppClients: () => `${greenCheck} Federated identity providers are not configured, no OAuth configuration needed.`,
  UserPoolOnlySuccess: (userPoolName: string) => `✅ Cognito User Pool '${userPoolName}' was successfully imported.`,
  UserPoolAndIdentityPoolSuccess: (userPoolName: string, identityPoolName: string) =>
    `✅ Cognito User Pool '${userPoolName}' and Identity Pool '${identityPoolName}' was successfully imported.`,

  UserPoolValidation: (userPoolName: string, userPoolId: string) =>
    `The previously configured Cognito User Pool: '${userPoolName}' (${userPoolId}) configuration is invalid.`,
  UserPoolNotFound: (userPoolName: string, userPoolId: string) =>
    `The previously configured Cognito User Pool: '${userPoolName}' (${userPoolId}) cannot be found.`,
  IdentityPoolNotFound: (identityPoolName: string, identityPoolId: string) =>
    `The previously configured Identity Pool: '${identityPoolName}' (${identityPoolId}) cannot be found.`,
  AppClientNotFound: (type: 'Web' | 'Native', clientId: string) => `The previously configured ${type} Application Client cannot be found.`,
  NoAtLeastOneAppClient: (type: 'Web' | 'Native') =>
    `The selected Cognito User Pool does not have at least 1 ${type} Application Client configured.`,

  OneIdentityPoolValid: (identityPoolName: string, identityPoolId: string) =>
    `${greenCheck} Only one Identity Pool resource found: '${identityPoolName}' (${identityPoolId}) was automatically selected.`,
  MultipleIdentityPools: ` Multiple Identity Pools are configured for the selected Cognito User Pool.`,
  NoIdentityPoolsFoundWithSelectedUserPool: `There are no Identity Pools found which has the selected Cognito User Pool configured as identity provider.`,
  NoIdentityPoolsForSelectedAppClientsFound: `There are no Identity Pools found which has the selected Application Clients configured as identity providers.`,

  NewEnvDifferentRegion: (resourceName: string, currentEnvRegion: string, newEnvRegion: string) =>
    `The previously imported '${resourceName}' auth resource was imported from '${currentEnvRegion}' region and the new environment's region is: '${newEnvRegion}', import a new resource to finish the creation of the new environment.`,
  NoClientInUserPool: (userPoolId: string, type: 'Web' | 'Native', clientId: string) =>
    `No ${type} Application Client with Client Id: '${clientId}' can be found in User Pool: '${userPoolId}'.`,

  ImportPreviousResourceFooter: `If you choose No, then an import walkthrough will run to import a different resource into the new environment.`,
  ImportNewResourceRequired: (resourceName: string) =>
    `Imported resource: '${resourceName}' found, parameters are required for environment creation.`,

  Questions: {
    UserPoolSelection: 'Select the User Pool you want to import:',
    IdentityPoolSelection: `Select the Identity Pool you want to import:`,
    AutoCompleteFooter: '(Type in a partial name or scroll up and down to reveal more choices)',
    AppClientValidation: `The selected Cognito User Pool does not have at least 1 web and 1 native application client configured.`,
    SelectAppClient: (type: 'Web' | 'Native') => `Select a ${type} client to import:`,
    ImportPreviousResource: (resourceName: string, userPoolId: string, envName: string) =>
      `The resource: '${resourceName}' (Cognito User Pool: '${userPoolId}') already imported to '${envName}' environment, do you want to import it to the new environment?`,
  },

  OAuth: {
    NoCommonProvidersFound: 'There are no common OAuth providers for the selected Application Clients.',
    SelectNewAppClients: 'Select new Application Clients',
    SomePropertiesAreNotMatching: 'The following OAuth properties are not matching:',
    ConfiguredIdentityProviders: 'Configured Identity Providers:',
    OAuthFlowEnabledForApplicationClient: 'OAuth Flow Enabled for Application Client:',
    CallbackURLs: 'Callback URLs:',
    LogoutURLs: 'Logout URLs:',
    AllowedOAuthFlows: 'Allowed OAuth Flows:',
    AllowedOAuthScopes: 'Allowed OAuth Scopes:',
    PropertiesAreNotMatching: 'OAuth properties for the Application Clients are not matching.',
  },
};

const greenCheck = chalk.green('✔');
