import { $TSAny, $TSContext, AmplifyFault, AmplifyError, parseArn } from '@aws-amplify/amplify-cli-core';
import { IIdentityPoolService } from '@aws-amplify/amplify-util-import';
import { CognitoIdentity } from 'aws-sdk';
import { PaginationKey, IdentityPool, IdentityPoolShortDescription, ListIdentityPoolsResponse } from 'aws-sdk/clients/cognitoidentity';
import { loadConfiguration } from '../configuration-manager';
import { pagedAWSCall } from './paged-call';

export const createIdentityPoolService = async (context: $TSContext, options: $TSAny): Promise<IdentityPoolService> => {
  let credentials = {};

  try {
    credentials = await loadConfiguration(context);
  } catch (e) {
    // could not load credentials
  }

  const cognitoIdentity = new CognitoIdentity({ ...credentials, ...options });

  return new IdentityPoolService(cognitoIdentity);
};

export class IdentityPoolService implements IIdentityPoolService {
  private cachedIdentityPoolIds: IdentityPoolShortDescription[] = [];
  private cachedIdentityPoolDetails: IdentityPool[] = [];

  public constructor(private cognitoIdentity: CognitoIdentity) {}

  public async listIdentityPools(): Promise<IdentityPoolShortDescription[]> {
    if (this.cachedIdentityPoolIds.length === 0) {
      const result = await pagedAWSCall<ListIdentityPoolsResponse, IdentityPoolShortDescription, PaginationKey>(
        async (params: CognitoIdentity.Types.ListIdentitiesInput, nextToken: PaginationKey) =>
          await this.cognitoIdentity
            .listIdentityPools({
              ...params,
              NextToken: nextToken,
            })
            .promise(),
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
          this.cognitoIdentity
            .describeIdentityPool({
              IdentityPoolId: idp.IdentityPoolId,
            })
            .promise(),
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
    const response = await this.cognitoIdentity
      .getIdentityPoolRoles({
        IdentityPoolId: identityPoolId,
      })
      .promise();

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
