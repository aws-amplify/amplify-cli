/**
 * AppSync GraphQL client for testing AmplifyAppSyncSimulator
 */

import * as http from 'http';
import type { GraphQLError } from 'graphql';
import { AmplifyAppSyncSimulator, AmplifyAppSyncSimulatorAuthenticationType } from '../../';
import { SignJWT } from 'jose';

/**
 * Minimal gql tag just for syntax highlighting and Prettier while writing client GraphQL queries
 */
export const gql = (chunks: TemplateStringsArray, ...variables: unknown[]): string =>
  chunks
    .reduce((accumulator, chunk, index) => `${accumulator}${chunk}${index in variables ? variables[index] : ''}`, '')
    .replace(/^\s+|\s$/g, '');

interface AppSyncSimulatorAuthentication {
  type: AmplifyAppSyncSimulatorAuthenticationType;
}

interface AppSyncSimulatorIAMAuthentication extends AppSyncSimulatorAuthentication {
  type: AmplifyAppSyncSimulatorAuthenticationType.AWS_IAM;
}

interface AppSyncSimulatorApiKeyAuthentication extends AppSyncSimulatorAuthentication {
  type: AmplifyAppSyncSimulatorAuthenticationType.API_KEY;
  apiKey: string;
}

interface AppSyncSimulatorCognitoKeyAuthentication extends AppSyncSimulatorAuthentication {
  type: AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS;
  username: string;
  groups?: readonly string[];
}

export async function appSyncClient<ResponseDataType = unknown, VarsType = Record<string, unknown>>({
  appSync,
  query,
  variables,
  auth,
}: {
  appSync: AmplifyAppSyncSimulator;
  query: string;
  variables?: VarsType;
  auth?: AppSyncSimulatorIAMAuthentication | AppSyncSimulatorApiKeyAuthentication | AppSyncSimulatorCognitoKeyAuthentication;
}): Promise<ResponseDataType> {
  const headers: http.OutgoingHttpHeaders = {
    'Content-Type': 'application/json',
  };
  switch (auth?.type) {
    case AmplifyAppSyncSimulatorAuthenticationType.API_KEY:
      headers['x-api-key'] = auth.apiKey;
      break;

    case AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS:
      headers.Authorization = await new SignJWT({
        username: auth.username,
        'cognito:groups': auth.groups ?? [],
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setIssuer('https://cognito-idp.mock-region.amazonaws.com/mockUserPool')
        .sign(new TextEncoder().encode('mockSecret'));
      break;

    case AmplifyAppSyncSimulatorAuthenticationType.AWS_IAM:
    default:
      // doing just enough to cheat amplify-appsync-simulator/src/utils/auth-helpers/helpers.ts
      headers.Authorization = `AWS4-HMAC-SHA256 Credential=${appSync.appSyncConfig.authAccessKeyId}/2021-12-12`;
  }

  return await new Promise((resolve, reject) => {
    const httpRequest = http.request(
      appSync.url,
      {
        host: 'localhost',
        path: '/graphql',
        method: 'POST',
        headers,
      },
      (result) => {
        let data = '';
        result
          .setEncoding('utf-8')
          .on('data', (chunk: string) => {
            data += chunk;
          })
          .once('end', () => {
            if (!result.headers['content-type']?.toLowerCase().includes('application/json')) {
              return reject(new Error(`AppSync GraphQL result failed: ${data}`));
            }
            const body: { data: ResponseDataType; errors?: readonly GraphQLError[] } = JSON.parse(data);
            if (body.errors?.length) {
              return reject(new Error(`GraphQL request error(s): ${JSON.stringify(body.errors)}`));
            }
            return resolve(body.data);
          })
          .once('error', (err) => reject(err));
      },
    );
    httpRequest.end(JSON.stringify({ query, variables }));
  });
}
