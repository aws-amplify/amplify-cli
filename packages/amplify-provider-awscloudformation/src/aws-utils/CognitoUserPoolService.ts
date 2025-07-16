import { $TSAny, $TSContext } from '@aws-amplify/amplify-cli-core';
import {
  CognitoIdentityProviderClient,
  ListUserPoolsCommand,
  DescribeUserPoolCommand,
  ListUserPoolClientsCommand,
  DescribeUserPoolClientCommand,
  GetUserPoolMfaConfigCommand,
  ListIdentityProvidersCommand,
  DescribeIdentityProviderCommand,
  UserPoolType,
  UserPoolDescriptionType,
  UserPoolClientType,
  UserPoolClientDescription,
  GetUserPoolMfaConfigResponse,
  IdentityProviderType,
  ListIdentityProvidersResponse,
  ListUserPoolClientsResponse,
  ListUserPoolsResponse,
  ProviderDescription,
  ListUserPoolClientsRequest,
  ListIdentityProvidersRequest,
  ListUserPoolsRequest,
} from '@aws-sdk/client-cognito-identity-provider';
import { ICognitoUserPoolService } from '@aws-amplify/amplify-util-import';
import { loadConfiguration } from '../configuration-manager';
import { fileLogger } from '../utils/aws-logger';
import { pagedAWSCall } from './paged-call';
const logger = fileLogger('CognitoUserPoolService');

export const createCognitoUserPoolService = async (context: $TSContext, options: $TSAny): Promise<CognitoUserPoolService> => {
  let credentials = {};

  try {
    credentials = await loadConfiguration(context);
  } catch (e) {
    // could not load credentials
  }

  const cognito = new CognitoIdentityProviderClient({ ...credentials, ...options });

  return new CognitoUserPoolService(cognito);
};

export class CognitoUserPoolService implements ICognitoUserPoolService {
  private cachedUserPoolIds: Array<UserPoolDescriptionType> = [];

  public constructor(private cognito: CognitoIdentityProviderClient) {}

  public async listUserPools(): Promise<UserPoolDescriptionType[]> {
    if (this.cachedUserPoolIds.length === 0) {
      const result = await pagedAWSCall<ListUserPoolsResponse, UserPoolDescriptionType, string>(
        async (params: ListUserPoolsRequest, nextToken: string) => {
          logger('listUserPool.cognito.listUserPools', [{ params, NextToken: nextToken }])();
          return await this.cognito.send(
            new ListUserPoolsCommand({
              ...params,
              NextToken: nextToken,
            }),
          );
        },
        {
          MaxResults: 60,
        },
        (response) => response?.UserPools,
        async (response) => response?.NextToken,
      );

      this.cachedUserPoolIds.push(...result);
    }

    return this.cachedUserPoolIds;
  }

  public async getUserPoolDetails(userPoolId: string): Promise<UserPoolType> {
    logger('getUserPoolDetails.cognito.describeUserPool', [{ userPoolId }])();
    const result = await this.cognito.send(
      new DescribeUserPoolCommand({
        UserPoolId: userPoolId,
      }),
    );

    return result.UserPool;
  }

  public async listUserPoolClients(userPoolId: string): Promise<UserPoolClientType[]> {
    const userPoolClients = await pagedAWSCall<ListUserPoolClientsResponse, UserPoolClientDescription, string>(
      async (params: ListUserPoolClientsRequest, nextToken: string) => {
        logger('listUserPoolClients.cognito.listUserPoolClients', [{ params, NextToken: nextToken }])();
        return await this.cognito.send(
          new ListUserPoolClientsCommand({
            ...params,
            NextToken: nextToken,
          }),
        );
      },
      {
        UserPoolId: userPoolId,
        MaxResults: 60,
      },
      (response) => response?.UserPoolClients,
      async (response) => response?.NextToken,
    );

    const userPoolClientDetails: UserPoolClientType[] = [];

    if (userPoolClients.length > 0) {
      const describeUserPoolClientPromises = userPoolClients.map((upc) => {
        logger('listUserPoolClients.cognito.listUserPoolClients', [
          {
            UserPoolId: userPoolId,
            ClientId: upc.ClientId,
          },
        ])();
        return this.cognito.send(
          new DescribeUserPoolClientCommand({
            UserPoolId: userPoolId,
            ClientId: upc.ClientId,
          }),
        );
      });

      const userPoolClientDetailsResults = await Promise.all(describeUserPoolClientPromises);

      userPoolClientDetails.push(...userPoolClientDetailsResults.map((response) => response.UserPoolClient));
    }

    return userPoolClientDetails;
  }

  public async listUserPoolIdentityProviders(userPoolId: string): Promise<IdentityProviderType[]> {
    const identityProviders = await pagedAWSCall<ListIdentityProvidersResponse, ProviderDescription, string>(
      async (params: ListIdentityProvidersRequest, nextToken: string) => {
        logger('listUserPoolIdentityProviders.cognito.listIdentityProviders', [
          {
            ...params,
            NextToken: nextToken,
          },
        ])();
        return await this.cognito.send(
          new ListIdentityProvidersCommand({
            ...params,
            NextToken: nextToken,
          }),
        );
      },
      {
        UserPoolId: userPoolId,
        MaxResults: 60,
      },
      (response) => response?.Providers,
      async (response) => response?.NextToken,
    );

    const identityPoolDetails: IdentityProviderType[] = [];

    if (identityProviders.length > 0) {
      const describeIdentityProviderPromises = identityProviders.map((idp) => {
        logger('listUserPoolIdentityProviders.cognito.describeIdentityProviderPromises', [
          {
            UserPoolId: userPoolId,
            ProviderName: idp.ProviderName,
          },
        ])();
        return this.cognito.send(
          new DescribeIdentityProviderCommand({
            UserPoolId: userPoolId,
            ProviderName: idp.ProviderName,
          }),
        );
      });

      const identityProviderDetailsResults = await Promise.all(describeIdentityProviderPromises);

      identityPoolDetails.push(...identityProviderDetailsResults.map((response) => response.IdentityProvider));
    }

    return identityPoolDetails;
  }

  public async getUserPoolMfaConfig(userPoolId: string): Promise<GetUserPoolMfaConfigResponse> {
    logger('getUserPoolMfaConfig.cognito.getUserPoolMfaConfig', [
      {
        UserPoolId: userPoolId,
      },
    ])();
    const result = await this.cognito.send(
      new GetUserPoolMfaConfigCommand({
        UserPoolId: userPoolId,
      }),
    );

    return result;
  }
}
