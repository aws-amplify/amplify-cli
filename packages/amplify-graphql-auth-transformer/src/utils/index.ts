import { DirectiveWrapper } from '@aws-amplify/graphql-transformer-core';
import { AppSyncAuthMode, TransformerContextProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { Stack } from '@aws-cdk/core';
import { ObjectTypeDefinitionNode } from 'graphql';
import { MODEL_OPERATIONS } from './constants';
import {
  AuthProvider, AuthRule, AuthTransformerConfig, ConfiguredAuthProviders, RoleDefinition, RolesByProvider,
} from './definitions';

export * from './constants';
export * from './definitions';
export * from './validations';
export * from './schema';
export * from './iam';

/**
 * Splits roles into key value pairs by auth type
 */
export const splitRoles = (roles: Array<RoleDefinition>): RolesByProvider => ({
  cognitoStaticRoles: roles.filter(r => r.static && r.provider === 'userPools'),
  cognitoDynamicRoles: roles.filter(r => !r.static && r.provider === 'userPools'),
  oidcStaticRoles: roles.filter(r => r.static && r.provider === 'oidc'),
  oidcDynamicRoles: roles.filter(r => !r.static && r.provider === 'oidc'),
  iamRoles: roles.filter(r => r.provider === 'iam'),
  apiKeyRoles: roles.filter(r => r.provider === 'apiKey'),
  lambdaRoles: roles.filter(r => r.provider === 'function'),
});

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
  } if (fieldDirectives.includes('predictions')) {
    return ctx.stackManager.getStack('PredictionsDirectiveStack');
  } if (hasModelDirective) {
    return ctx.stackManager.getStack(obj.name.value);
  }
  return ctx.stackManager.rootStack;
};

/**
 * Returns auth provider passed on config
 */
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
      case 'AWS_LAMBDA':
        return 'function';
      default:
        return 'apiKey';
    }
  };

  const hasIAM = providers.some(p => p === 'AWS_IAM');
  const configuredProviders: ConfiguredAuthProviders = {
    default: getAuthProvider(config.authConfig.defaultAuthentication.authenticationType),
    onlyDefaultAuthProviderConfigured: config.authConfig.additionalAuthenticationProviders.length === 0,
    hasAdminRolesEnabled: hasIAM && config.adminRoles?.length > 0,
    adminRoles: config.adminRoles,
    identityPoolId: config.identityPoolId,
    hasApiKey: providers.some(p => p === 'API_KEY'),
    hasUserPools: providers.some(p => p === 'AMAZON_COGNITO_USER_POOLS'),
    hasOIDC: providers.some(p => p === 'OPENID_CONNECT'),
    hasLambda: providers.some(p => p === 'AWS_LAMBDA'),
    hasIAM,
  };
  return configuredProviders;
};

/**
 * Gets the rules from the auth directive
 */
export const getAuthDirectiveRules = (authDir: DirectiveWrapper): AuthRule[] => {
  const { rules } = authDir.getArguments<{ rules: Array<AuthRule> }>({ rules: [] });
  /* eslint-disable no-param-reassign */
  rules.forEach(rule => {
    rule.operations = rule.operations ?? MODEL_OPERATIONS;

    if (!rule.provider) {
      rule.provider = getDefaultRuleProvider(rule);
    }

    if (rule.provider === 'iam') {
      rule.generateIAMPolicy = true;
    }
  });
  /* eslint-enable */
  return rules;
};

const getDefaultRuleProvider = (rule: AuthRule): AuthProvider => {
  switch (rule.allow) {
    case 'owner':
    case 'groups':
      return 'userPools';
    case 'private':
      return 'userPools';
    case 'public':
      return 'apiKey';
    case 'custom':
      return 'function';
    default:
      throw new Error(`Need to specify an allow to assigned a provider: ${rule}`);
  }
};
