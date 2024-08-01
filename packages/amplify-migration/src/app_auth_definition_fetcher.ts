import assert from 'node:assert';
import { AuthDefinition } from '@aws-amplify/amplify-gen2-codegen';
import { CognitoIdentityProviderClient, DescribeUserPoolCommand, LambdaConfigType } from '@aws-sdk/client-cognito-identity-provider';
import { getAuthDefinition } from '@aws-amplify/amplify-gen1-codegen-auth-adapter';
import { AmplifyStackParser } from './amplify_stack_parser';
import { BackendEnvironmentResolver } from './backend_environment_selector';

export interface AppAuthDefinitionFetcher {
  getDefinition(): Promise<AuthDefinition | undefined>;
}

export type AuthTriggerConnectionsFetcher = () => Promise<Partial<Record<keyof LambdaConfigType, string>> | undefined>;

export class AppAuthDefinitionFetcher {
  constructor(
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

    const authTriggerConnections = await this.getAuthTriggerConnections();

    assert(userPool, 'User pool not found');
    return getAuthDefinition({ userPool, authTriggerConnections });
  };
}
