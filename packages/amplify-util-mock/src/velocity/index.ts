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
} from 'amplify-appsync-simulator';

const DEFAULT_SCHEMA = `
  type Query {
    noop: String
  }`;

export interface VelocityTemplateSimulatorOptions {
  template: string;
  authConfig: AppSyncAuthConfiguration;
}
export type AppSyncVTLContext = Partial<AppSyncVTLRenderContext>;

export class VelocityTemplateSimulator {
  velocityTemplate: VelocityTemplate;

  constructor(opts: VelocityTemplateSimulatorOptions) {
    const gqlSimulator = new AmplifyAppSyncSimulator();
    gqlSimulator.init({
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
    this.velocityTemplate = new VelocityTemplate({ content: opts.template }, gqlSimulator);
  }
  render(context: AppSyncVTLContext, requestParameters: AppSyncGraphQLExecutionContext, info: Partial<GraphQLResolveInfo> = {}) {
    const ctxParameters: AppSyncVTLRenderContext = { source: {}, arguments: { input: {} }, stash: {}, ...context };
    const vtlInfo: any = { fieldNodes: [], fragments: {}, path: { key: '' }, ...info };
    return this.velocityTemplate.render(ctxParameters, requestParameters, vtlInfo);
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
    'cognitio:groups': groups,
    email,
  };
  return token;
};
