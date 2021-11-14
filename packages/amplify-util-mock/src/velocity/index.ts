import { v4 } from 'uuid';
import { AppSyncAuthConfiguration } from '@aws-amplify/graphql-transformer-interfaces';
import { GraphQLResolveInfo } from 'graphql';
import {
  AmplifyAppSyncSimulator,
  AmplifyAppSyncAuthenticationProviderConfig,
  VelocityTemplate,
  AppSyncVTLRenderContext,
  AppSyncGraphQLExecutionContext,
  JWTToken,
  IAMToken,
} from 'amplify-appsync-simulator';

const DEFAULT_SCHEMA = `
  type Query {
    noop: String
  }`;

type iamCognitoIdentityContext = Partial<
  Pick<IAMToken, 'cognitoIdentityPoolId' | 'cognitoIdentityAuthProvider' | 'cognitoIdentityAuthType' | 'cognitoIdentityId'>
>;

export interface VelocityTemplateSimulatorOptions {
  authConfig: AppSyncAuthConfiguration;
}
export type AppSyncVTLContext = Partial<AppSyncVTLRenderContext>;

export type AppSyncVTLPayload = {
  context: Partial<AppSyncVTLRenderContext>;
  requestParameters: AppSyncGraphQLExecutionContext;
  info?: Partial<GraphQLResolveInfo>;
};

export class VelocityTemplateSimulator {
  private gqlSimulator: AmplifyAppSyncSimulator;

  constructor(opts: VelocityTemplateSimulatorOptions) {
    this.gqlSimulator = new AmplifyAppSyncSimulator();
    this.gqlSimulator.init({
      schema: {
        content: DEFAULT_SCHEMA,
      },
      appSync: {
        name: 'appsyncAPI',
        defaultAuthenticationType: opts.authConfig.defaultAuthentication as AmplifyAppSyncAuthenticationProviderConfig,
        additionalAuthenticationProviders: opts.authConfig
          .additionalAuthenticationProviders as AmplifyAppSyncAuthenticationProviderConfig[],
      },
    });
  }
  render(template: string, payload: AppSyncVTLPayload) {
    const ctxParameters: AppSyncVTLRenderContext = { source: {}, arguments: { input: {} }, stash: {}, ...payload.context };
    const vtlInfo: any = { fieldNodes: [], fragments: {}, path: { key: '' }, ...(payload.info ?? {}) };
    const vtlTemplate = new VelocityTemplate({ content: template }, this.gqlSimulator);
    return vtlTemplate.render(ctxParameters, payload.requestParameters, vtlInfo);
  }
}

export const getJWTToken = (
  userPool: string,
  username: string,
  email: string,
  groups: string[] = [],
  tokenType: 'id' | 'access' = 'id',
): JWTToken => {
  const token: JWTToken = {
    iss: `https://cognito-idp.us-west-2.amazonaws.com/us-west-2_${userPool}`,
    sub: v4(),
    aud: '75pk49boud2olipfda0ke3snic',
    exp: Math.floor(Date.now() / 1000) + 10000,
    iat: Math.floor(Date.now() / 1000),
    event_id: v4(),
    token_use: tokenType,
    auth_time: Math.floor(Date.now() / 1000),
    'cognito:username': username,
    'cognito:groups': groups,
    email,
  };
  return token;
};

export const getGenericToken = (username: string, email: string, groups: string[] = [], tokenType: 'id' | 'access' = 'id'): JWTToken => {
  return {
    iss: 'https://some-oidc-provider/auth',
    sub: v4(),
    aud: '75pk49boud2olipfda0ke3snic',
    exp: Math.floor(Date.now() / 1000) + 10000,
    iat: Math.floor(Date.now() / 1000),
    event_id: v4(),
    token_use: tokenType,
    auth_time: Math.floor(Date.now() / 1000),
    username,
    email,
    groups,
  };
};

export const getIAMToken = (username: string, identityInfo?: iamCognitoIdentityContext): IAMToken => {
  let iamRoleName = username;
  if (identityInfo?.cognitoIdentityAuthType) {
    iamRoleName = identityInfo.cognitoIdentityAuthType === 'authenticated' ? 'authRole' : 'unauthRole';
  }
  return {
    username,
    userArn: `arn:aws:sts::123456789012:assumed-role/${iamRoleName}/CognitoIdentityCredentials`,
    accountId: '123456789012',
    cognitoIdentityPoolId: identityInfo?.cognitoIdentityPoolId,
    cognitoIdentityAuthProvider: identityInfo?.cognitoIdentityAuthProvider,
    cognitoIdentityId: identityInfo?.cognitoIdentityId,
    cognitoIdentityAuthType: identityInfo?.cognitoIdentityAuthType,
  };
};
