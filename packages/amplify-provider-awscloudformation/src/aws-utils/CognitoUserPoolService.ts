import { $TSAny, $TSContext } from 'amplify-cli-core';
import { ICognitoUserPoolService } from 'amplify-util-import';
import { CognitoIdentityServiceProvider } from 'aws-sdk';
import {
  GetUserPoolMfaConfigResponse,
  IdentityProviderType,
  ListIdentityProvidersResponse,
  ListUserPoolClientsResponse,
  ListUserPoolsResponse,
  PaginationKeyType,
  ProviderDescription,
  UserPoolClientDescription,
  UserPoolClientType,
  UserPoolDescriptionType,
  UserPoolType,
} from 'aws-sdk/clients/cognitoidentityserviceprovider';
import configurationManager from '../configuration-manager';
import { pagedAWSCall } from './paged-call';
import { fileLogger } from '../utils/aws-logger';
const logger = fileLogger('CognitoUserPoolService');

export const createCognitoUserPoolService = async (context: $TSContext, options: $TSAny): Promise<CognitoUserPoolService> => {
  let credentials = {};

  try {
    credentials = await configurationManager.loadConfiguration(context);
  } catch (e) {
    // could not load credentials
  }

  const cognito = new CognitoIdentityServiceProvider({ ...credentials, ...options });

  return new CognitoUserPoolService(cognito);
};

export class CognitoUserPoolService implements ICognitoUserPoolService {
  private cachedUserPoolIds: Array<UserPoolDescriptionType> = [];

  public constructor(private cognito: CognitoIdentityServiceProvider) {}

  public async listUserPools(): Promise<UserPoolDescriptionType[]> {
    if (this.cachedUserPoolIds.length === 0) {
      const result = await pagedAWSCall<ListUserPoolsResponse, UserPoolDescriptionType, PaginationKeyType>(
        async (params: CognitoIdentityServiceProvider.Types.ListUserPoolsRequest, nextToken: PaginationKeyType) => {
          logger('listUserPool.cognito.listUserPools', [{ params, NextToken: nextToken }])();
          return await this.cognito
            .listUserPools({
              ...params,
              NextToken: nextToken,
            })
            .promise();
        },
        {
          MaxResults: 60,
        },
        response => response?.UserPools,
        async response => response?.NextToken,
      );

      this.cachedUserPoolIds.push(...result);
    }

    return this.cachedUserPoolIds;
  }

  public async getUserPoolDetails(userPoolId: string): Promise<UserPoolType> {
    logger('getUserPoolDetails.cognito.describeUserPool', [{ userPoolId }])();
    try {
      const result = await this.cognito
        .describeUserPool({
          UserPoolId: userPoolId,
        })
        .promise();

      return result.UserPool;
    } catch (ex) {
      logger('getUserPoolDetails.cognito.describeUserPool', [{ userPoolId }])(ex);
      throw ex;
    }
  }

  public async listUserPoolClients(userPoolId: string): Promise<UserPoolClientType[]> {
    const userPoolClients = await pagedAWSCall<ListUserPoolClientsResponse, UserPoolClientDescription, PaginationKeyType>(
      async (params: CognitoIdentityServiceProvider.Types.ListUserPoolClientsRequest, nextToken: PaginationKeyType) => {
        logger('listUserPoolClients.cognito.listUserPoolClients', [{ params, NextToken: nextToken }])();
        return await this.cognito
          .listUserPoolClients({
            ...params,
            NextToken: nextToken,
          })
          .promise();
      },
      {
        UserPoolId: userPoolId,
        MaxResults: 60,
      },
      response => response?.UserPoolClients,
      async response => response?.NextToken,
    );

    const userPoolClientDetails: UserPoolClientType[] = [];

    if (userPoolClients.length > 0) {
      const describeUserPoolClientPromises = userPoolClients.map(upc => {
        logger('listUserPoolClients.cognito.listUserPoolClients', [
          {
            UserPoolId: userPoolId,
            ClientId: upc.ClientId,
          },
        ])();
        return this.cognito
          .describeUserPoolClient({
            UserPoolId: userPoolId,
            ClientId: upc.ClientId,
          })
          .promise();
      });

      const userPoolClientDetailsResults = await Promise.all(describeUserPoolClientPromises);

      userPoolClientDetails.push(...userPoolClientDetailsResults.map(response => response.UserPoolClient));
    }

    return userPoolClientDetails;
  }

  public async listUserPoolIdentityProviders(userPoolId: string): Promise<IdentityProviderType[]> {
    const identityProviders = await pagedAWSCall<ListIdentityProvidersResponse, ProviderDescription, PaginationKeyType>(
      async (params: CognitoIdentityServiceProvider.Types.ListIdentityProvidersRequest, nextToken: PaginationKeyType) => {
        logger('listUserPoolIdentityProviders.cognito.listIdentityProviders', [
          {
            ...params,
            NextToken: nextToken,
          },
        ])();
        return await this.cognito
          .listIdentityProviders({
            ...params,
            NextToken: nextToken,
          })
          .promise();
      },
      {
        UserPoolId: userPoolId,
        MaxResults: 60,
      },
      response => response?.Providers,
      async response => response?.NextToken,
    );

    const identityPoolDetails: IdentityProviderType[] = [];

    if (identityProviders.length > 0) {
      const describeIdentityProviderPromises = identityProviders.map(idp => {
        logger('listUserPoolIdentityProviders.cognito.describeIdentityProviderPromises', [
          {
            UserPoolId: userPoolId,
            ProviderName: idp.ProviderName,
          },
        ])();
        return this.cognito
          .describeIdentityProvider({
            UserPoolId: userPoolId,
            ProviderName: idp.ProviderName,
          })
          .promise();
      });

      const identityProviderDetailsResults = await Promise.all(describeIdentityProviderPromises);

      identityPoolDetails.push(...identityProviderDetailsResults.map(response => response.IdentityProvider));
    }

    return identityPoolDetails;
  }

  public async getUserPoolMfaConfig(userPoolId: string): Promise<GetUserPoolMfaConfigResponse> {
    logger('getUserPoolMfaConfig.cognito.getUserPoolMfaConfig', [
      {
        UserPoolId: userPoolId,
      },
    ])();
    const result = await this.cognito
      .getUserPoolMfaConfig({
        UserPoolId: userPoolId,
      })
      .promise();

    return result;
  }
}
