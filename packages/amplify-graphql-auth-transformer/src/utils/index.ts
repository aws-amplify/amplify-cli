import { DirectiveWrapper } from '@aws-amplify/graphql-transformer-core';
import { AppSyncAuthMode } from '@aws-amplify/graphql-transformer-interfaces';
import { TransformerContextProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { Stack } from '@aws-cdk/core';
import { ObjectTypeDefinitionNode } from 'graphql';
import { AccessControlMatrix, MODEL_OPERATIONS } from '..';
import { AuthProvider, AuthRule, AuthTransformerConfig, ConfiguredAuthProviders, RoleDefinition, RolesByProvider } from './definitions';

export * from './constants';
export * from './definitions';
export * from './validations';
export * from './schema';
export * from './iam';

export const splitRoles = (roles: Array<RoleDefinition>): RolesByProvider => {
  return {
    cognitoStaticRoles: roles.filter(r => r.static && r.provider === 'userPools'),
    cognitoDynamicRoles: roles.filter(r => !r.static && r.provider === 'userPools'),
    oidcStaticRoles: roles.filter(r => r.static && r.provider === 'oidc'),
    oidcDynamicRoles: roles.filter(r => !r.static && r.provider === 'oidc'),
    iamRoles: roles.filter(r => r.provider === 'iam'),
    apiKeyRoles: roles.filter(r => r.provider === 'apiKey'),
    lambdaRoles: roles.filter(r => r.provider === 'function'),
  };
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
      case 'AWS_LAMBDA':
        return 'function';
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
 * util to get allowed roles for field
 * if we have a rule like cognito private we can remove all other related roles from the field since it has top level
 * access by the provider
 */
export const getReadRolesForField = (acm: AccessControlMatrix, readRoles: Array<string>, fieldName: string): Array<string> => {
  const hasCognitoPrivateRole = readRoles.some(r => r === 'userPools:private') && acm.isAllowed('userPools:private', fieldName, 'read');
  const hasOIDCPrivateRole = readRoles.some(r => r === 'oidc:private') && acm.isAllowed('oidc:private', fieldName, 'read');
  let allowedRoles = [...readRoles];

  if (hasCognitoPrivateRole) {
    allowedRoles = allowedRoles.filter(r => !(r.startsWith('userPools:') && r !== 'userPools:private'));
  }
  if (hasOIDCPrivateRole) {
    allowedRoles = allowedRoles.filter(r => !(r.startsWith('oidc:') && r !== 'oidc:private'));
  }
  return allowedRoles;
};

export const getAuthDirectiveRules = (authDir: DirectiveWrapper): AuthRule[] => {
  const rules = authDir.getArguments<{ rules: Array<AuthRule> }>({ rules: [] }).rules;
  for (const rule of rules) {
    rule.operations = rule.operations ?? MODEL_OPERATIONS;

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
        case 'custom':
          rule.provider = 'function';
          break;
        default:
          throw new Error(`Need to specify an allow to assigned a provider: ${rule}`);
      }
    }

    if (rule.provider === 'iam') {
      rule.generateIAMPolicy = true;
    }
  }
  return rules;
};
