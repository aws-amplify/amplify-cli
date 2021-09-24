import { ModelDirectiveConfiguration, SubscriptionLevel } from '@aws-amplify/graphql-model-transformer';
import { DirectiveWrapper } from '@aws-amplify/graphql-transformer-core';
import { AppSyncAuthMode } from '@aws-amplify/graphql-transformer-interfaces';
import { TransformerContextProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { Stack } from '@aws-cdk/core';
import { DirectiveNode, ObjectTypeDefinitionNode } from 'graphql';
import { toCamelCase, plurality, graphqlName, toUpper } from 'graphql-transformer-common';
import {
  AuthProvider,
  AuthRule,
  AuthTransformerConfig,
  ConfiguredAuthProviders,
  RoleDefinition,
  RolesByProvider,
  SearchableConfig,
} from './definitions';

export * from './constants';
export * from './definitions';
export * from './validations';
export * from './schema';
export * from './iam';

export const splitRoles = (roles: Array<RoleDefinition>): RolesByProvider => {
  return {
    cogntoStaticRoles: roles.filter(r => r.static && r.provider === 'userPools'),
    cognitoDynamicRoles: roles.filter(r => !r.static && r.provider === 'userPools'),
    oidcStaticRoles: roles.filter(r => r.static && r.provider === 'oidc'),
    oidcDynamicRoles: roles.filter(r => !r.static && r.provider === 'oidc'),
    iamRoles: roles.filter(r => r.provider === 'iam'),
    apiKeyRoles: roles.filter(r => r.provider === 'apiKey'),
  };
};
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

export const getModelConfig = (directive: DirectiveNode, typeName: string, isDataStoreEnabled = false): ModelDirectiveConfiguration => {
  const directiveWrapped: DirectiveWrapper = new DirectiveWrapper(directive);
  const options = directiveWrapped.getArguments<ModelDirectiveConfiguration>({
    queries: {
      get: toCamelCase(['get', typeName]),
      list: toCamelCase(['list', plurality(typeName, true)]),
      ...(isDataStoreEnabled ? { sync: toCamelCase(['sync', plurality(typeName, true)]) } : undefined),
    },
    mutations: {
      create: toCamelCase(['create', typeName]),
      update: toCamelCase(['update', typeName]),
      delete: toCamelCase(['delete', typeName]),
    },
    subscriptions: {
      level: SubscriptionLevel.on,
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

export const getSearchableConfig = (directive: DirectiveNode, typeName: string): SearchableConfig | null => {
  const directiveWrapped: DirectiveWrapper = new DirectiveWrapper(directive);
  const options = directiveWrapped.getArguments<SearchableConfig>({
    queries: {
      search: graphqlName(`search${plurality(toUpper(typeName), true)}`),
    },
  });
  return options;
};
/**
 * gets stack name if the field is paired with function, predictions, or by itself
 */
export const getStackForField = (
  ctx: TransformerContextProvider,
  obj: ObjectTypeDefinitionNode,
  fieldName: string,
  hasModelDirective: boolean,
): Stack => {
  const fieldNode = obj.fields.find(f => f.name.value === fieldName);
  const fieldDirectives = fieldNode.directives.map(d => d.name.value);
  if (fieldDirectives.includes('function')) {
    return ctx.stackManager.getStack('FunctionDirectiveStack');
  } else if (fieldDirectives.includes('predictions')) {
    return ctx.stackManager.getStack('PredictionsDirectiveStack');
  } else if (hasModelDirective) {
    return ctx.stackManager.getStack(obj.name.value);
  } else {
    return ctx.stackManager.rootStack;
  }
};

export const getConfiguredAuthProviders = (config: AuthTransformerConfig): ConfiguredAuthProviders => {
  const providers = [
    config.authConfig.defaultAuthentication.authenticationType,
    ...config.authConfig.additionalAuthenticationProviders.map(p => p.authenticationType),
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
  const hasIAM = providers.some(p => p === 'AWS_IAM');
  const configuredProviders: ConfiguredAuthProviders = {
    default: getAuthProvider(config.authConfig.defaultAuthentication.authenticationType),
    onlyDefaultAuthProviderConfigured: config.authConfig.additionalAuthenticationProviders.length === 0,
    hasAdminUIEnabled: hasIAM && config.addAwsIamAuthInOutputSchema,
    adminUserPoolID: config.adminUserPoolID!,
    hasApiKey: providers.some(p => p === 'API_KEY'),
    hasUserPools: providers.some(p => p === 'AMAZON_COGNITO_USER_POOLS'),
    hasOIDC: providers.some(p => p === 'OPENID_CONNECT'),
    hasIAM,
  };
  return configuredProviders;
};
