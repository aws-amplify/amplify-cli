import { $TSAny, $TSContext, AmplifyFault, AmplifyError, parseArn } from '@aws-amplify/amplify-cli-core';
import { IIdentityPoolService } from '@aws-amplify/amplify-util-import';
import {
  CognitoIdentityClient,
  ListIdentityPoolsCommand,
  DescribeIdentityPoolCommand,
  GetIdentityPoolRolesCommand,
  IdentityPool,
  IdentityPoolShortDescription,
  ListIdentityPoolsResponse,
  ListIdentityPoolsInput,
} from '@aws-sdk/client-cognito-identity';
import { AwsV3Secrets, loadConfiguration } from '../configuration-manager';
import { pagedAWSCall } from './paged-call';

export const createIdentityPoolService = async (context: $TSContext, options: $TSAny): Promise<IdentityPoolService> => {
  let credentials: AwsV3Secrets = {};

  try {
    credentials = await loadConfiguration(context);
  } catch (e) {
    // could not load credentials
  }

  const cognitoIdentity = new CognitoIdentityClient({
    ...options,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken,
      expiration: credentials.expiration,
    },
    region: credentials.region,
  });

  return new IdentityPoolService(cognitoIdentity);
};

export class IdentityPoolService implements IIdentityPoolService {
  private cachedIdentityPoolIds: IdentityPoolShortDescription[] = [];
  private cachedIdentityPoolDetails: IdentityPool[] = [];

  public constructor(private cognitoIdentity: CognitoIdentityClient) {}

  public async listIdentityPools(): Promise<IdentityPoolShortDescription[]> {
    if (this.cachedIdentityPoolIds.length === 0) {
      const result = await pagedAWSCall<ListIdentityPoolsResponse, IdentityPoolShortDescription, string>(
        async (params: ListIdentityPoolsInput, nextToken: string) =>
          await this.cognitoIdentity.send(
            new ListIdentityPoolsCommand({
              ...params,
              NextToken: nextToken,
            }),
          ),
        {
          MaxResults: 60,
        },
        (response) => response?.IdentityPools,
        async (response) => response?.NextToken,
      );

      this.cachedIdentityPoolIds.push(...result);
    }

    return this.cachedIdentityPoolIds;
  }

  public async listIdentityPoolDetails(): Promise<IdentityPool[]> {
    if (this.cachedIdentityPoolDetails.length === 0) {
      const identityPools = await this.listIdentityPools();

      const identityPoolDetails = [];

      if (identityPools.length > 0) {
        const describeIdentityPoolPromises = identityPools.map((idp) =>
          this.cognitoIdentity.send(
            new DescribeIdentityPoolCommand({
              IdentityPoolId: idp.IdentityPoolId,
            }),
          ),
        );

        const identityPoolDetailResults = await Promise.all(describeIdentityPoolPromises);

        identityPoolDetails.push(...identityPoolDetailResults);
      }

      this.cachedIdentityPoolDetails.push(...identityPoolDetails);
    }

    return this.cachedIdentityPoolDetails;
  }

  public async getIdentityPoolRoles(
    identityPoolId: string,
  ): Promise<{ authRoleArn: string; authRoleName: string; unauthRoleArn: string; unauthRoleName: string }> {
    const response = await this.cognitoIdentity.send(
      new GetIdentityPoolRolesCommand({
        IdentityPoolId: identityPoolId,
      }),
    );

    if (!response.Roles || !response.Roles.authenticated || !response.Roles.unauthenticated) {
      throw new AmplifyError('AuthImportError', {
        message: `Cannot import Identity Pool without 'authenticated' and 'unauthenticated' roles.`,
      });
    }

    return {
      authRoleArn: response.Roles.authenticated,
      authRoleName: this.getResourceNameFromArn(response.Roles.authenticated),
      unauthRoleArn: response.Roles.unauthenticated,
      unauthRoleName: this.getResourceNameFromArn(response.Roles.unauthenticated),
    };
  }

  private getResourceNameFromArn = (arn: string): string => {
    let resourceName;

    if (arn) {
      const fullRoleName = parseArn(arn).resource;
      const parts = fullRoleName.split('/');
      if (parts.length >= 2) {
        resourceName = [...parts].pop();
      }
    }

    // Should not happen anytime
    if (!resourceName) {
      throw new AmplifyFault('UnknownFault', {
        message: `Cannot parse arn: '${arn}'.`,
      });
    }

    return resourceName;
  };
}
