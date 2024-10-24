import assert from 'node:assert';
import { AuthDefinition } from '@aws-amplify/amplify-gen2-codegen';
export type AuthTriggerConnectionsFetcher = () => Promise<Partial<Record<keyof LambdaConfigType, string>> | undefined>;
import { AmplifyStackParser } from './amplify_stack_parser';
import { BackendEnvironmentResolver } from './backend_environment_selector';
import {
  CognitoIdentityProviderClient,
  DescribeUserPoolCommand,
  DescribeUserPoolClientCommand,
  ListIdentityProvidersCommand,
  LambdaConfigType,
  ListGroupsCommand,
  IdentityProviderType,
  DescribeIdentityProviderCommand,
  GetUserPoolMfaConfigCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { CognitoIdentityClient, DescribeIdentityPoolCommand } from '@aws-sdk/client-cognito-identity';
import { getAuthDefinition } from '@aws-amplify/amplify-gen1-codegen-auth-adapter';

export interface AppAuthDefinitionFetcher {
  getDefinition(): Promise<AuthDefinition | undefined>;
}

export class AppAuthDefinitionFetcher {
  constructor(
    private cognitoIdentityPoolClient: CognitoIdentityClient,
    private cognitoIdentityProviderClient: CognitoIdentityProviderClient,
    private stackParser: AmplifyStackParser,
    private backendEnvironmentResolver: BackendEnvironmentResolver,
    private getAuthTriggerConnections: AuthTriggerConnectionsFetcher,
  ) {}

  getDefinition = async (): Promise<AuthDefinition | undefined> => {
    const backendEnvironment = await this.backendEnvironmentResolver.selectBackendEnvironment();
    assert(backendEnvironment?.stackName);
    const stackResources = await this.stackParser.getAllStackResources(backendEnvironment.stackName);
    const resourcesByLogicalId = this.stackParser.getResourcesByLogicalId(stackResources);

    if (!resourcesByLogicalId['UserPool']) {
      return undefined;
    }

    const { UserPool: userPool } = await this.cognitoIdentityProviderClient.send(
      new DescribeUserPoolCommand({
        UserPoolId: resourcesByLogicalId['UserPool'].PhysicalResourceId,
      }),
    );

    const { MfaConfiguration: mfaConfig, SoftwareTokenMfaConfiguration: totpConfig } = await this.cognitoIdentityProviderClient.send(
      new GetUserPoolMfaConfigCommand({
        UserPoolId: resourcesByLogicalId['UserPool'].PhysicalResourceId,
      }),
    );

    const { UserPoolClient: webClient } = await this.cognitoIdentityProviderClient.send(
      new DescribeUserPoolClientCommand({
        UserPoolId: resourcesByLogicalId['UserPool'].PhysicalResourceId,
        ClientId: resourcesByLogicalId['UserPoolClientWeb'].PhysicalResourceId,
      }),
    );

    const { Providers: identityProviders } = await this.cognitoIdentityProviderClient.send(
      new ListIdentityProvidersCommand({
        UserPoolId: resourcesByLogicalId['UserPool'].PhysicalResourceId,
      }),
    );

    const identityProvidersDetails: IdentityProviderType[] = [];
    for (const provider of identityProviders || []) {
      const { IdentityProvider: providerDetails } = await this.cognitoIdentityProviderClient.send(
        new DescribeIdentityProviderCommand({
          UserPoolId: resourcesByLogicalId['UserPool'].PhysicalResourceId,
          ProviderName: provider.ProviderName,
        }),
      );
      if (providerDetails) {
        identityProvidersDetails.push(providerDetails);
      }
    }

    const { Groups: identityGroups } = await this.cognitoIdentityProviderClient.send(
      new ListGroupsCommand({
        UserPoolId: resourcesByLogicalId['UserPool'].PhysicalResourceId,
      }),
    );

    const { AllowUnauthenticatedIdentities: guestLogin, IdentityPoolName: identityPoolName } = await this.cognitoIdentityPoolClient.send(
      new DescribeIdentityPoolCommand({
        IdentityPoolId: resourcesByLogicalId['IdentityPool'].PhysicalResourceId,
      }),
    );

    const authTriggerConnections = await this.getAuthTriggerConnections();

    assert(userPool, 'User pool not found');
    return getAuthDefinition({
      userPool,
      identityPoolName,
      identityProviders,
      identityProvidersDetails,
      identityGroups,
      webClient,
      authTriggerConnections,
      guestLogin,
      mfaConfig,
      totpConfig,
    });
  };
}
