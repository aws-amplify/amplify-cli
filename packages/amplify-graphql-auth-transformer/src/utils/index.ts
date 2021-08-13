import { ModelDirectiveConfiguration, SubscriptionLevel } from '@aws-amplify/graphql-model-transformer';
import { AppSyncAuthConfiguration, AppSyncAuthMode, DirectiveWrapper } from '@aws-amplify/graphql-transformer-core';
import { DirectiveNode } from 'graphql';
import { toCamelCase, plurality } from 'graphql-transformer-common';
import { AuthProvider, AuthRule } from './definitions';

export * from './constants';
export * from './definitions';
export * from './validations';
export * from './schema';
export * from './iam';

/**
 * Ensure the following defaults
 * - provider
 * - iam policy generation
 */
export const ensureAuthRuleDefaults = (rules: AuthRule[]) => {
  // We assign the default provider if an override is not present make further handling easier.
  for (const rule of rules) {
    if (!rule.provider) {
      switch (rule.allow) {
        case 'owner':
        case 'groups':
          rule.provider = 'userPools';
          break;
        case 'private':
          rule.provider = 'userPools';
          break;
        case 'public':
          rule.provider = 'apiKey';
          break;
        default:
          throw new Error(`Need to specify an allow to assigned a provider: ${rule}`);
      }
    }
    // by default we generate an IAM policy for every rule
    if (rule.provider === 'iam' && !rule.generateIAMPolicy) {
      rule.generateIAMPolicy = true;
    }
  }
};

export const getModelConfig = (directive: DirectiveNode, typeName: string): ModelDirectiveConfiguration => {
  const directiveWrapped: DirectiveWrapper = new DirectiveWrapper(directive);
  const options = directiveWrapped.getArguments<ModelDirectiveConfiguration>({
    queries: {
      get: toCamelCase(['get', typeName]),
      list: toCamelCase(['list', plurality(typeName, true)]),
    },
    mutations: {
      create: toCamelCase(['create', typeName]),
      update: toCamelCase(['update', typeName]),
      delete: toCamelCase(['delete', typeName]),
    },
    subscriptions: {
      level: SubscriptionLevel.public,
      onCreate: [toCamelCase(['onCreate', typeName])],
      onDelete: [toCamelCase(['onDelete', typeName])],
      onUpdate: [toCamelCase(['onUpdate', typeName])],
    },
    timestamps: {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    },
  });
  return options;
};

export const getConfiguredAuthProviders = (authConfig: AppSyncAuthConfiguration) => {
  const providers = [
    authConfig.defaultAuthentication.authenticationType,
    ...authConfig.additionalAuthenticationProviders.map(p => p.authenticationType),
  ];
  const getAuthProvider = (authType: AppSyncAuthMode): AuthProvider => {
    switch (authType) {
      case 'AMAZON_COGNITO_USER_POOLS':
        return 'userPools';
      case 'API_KEY':
        return 'apiKey';
      case 'AWS_IAM':
        return 'iam';
      case 'OPENID_CONNECT':
        return 'oidc';
    }
  };

  return {
    default: getAuthProvider(authConfig.defaultAuthentication.authenticationType),
    onlyDefaultAuthProviderConfigured: authConfig.additionalAuthenticationProviders.length === 0,
    hasApiKey: providers.some(p => p === 'API_KEY'),
    hasUserPools: providers.some(p => p === 'AMAZON_COGNITO_USER_POOLS'),
    hasOIDC: providers.some(p => p === 'OPENID_CONNECT'),
    hasIAM: providers.some(p => p === 'AWS_IAM'),
  };
};
