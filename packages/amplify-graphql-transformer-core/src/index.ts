import { print } from 'graphql';
import { EXTRA_DIRECTIVES_DOCUMENT } from './transformation/validation';
export { GraphQLTransform, GraphQLTransformOptions, SyncUtils } from './transformation';
export { DeploymentResources } from './transformation/types';
export { validateModelSchema } from './transformation/validation';
export {
  ConflictDetectionType,
  ConflictHandlerType,
  ResolverConfig,
  SyncConfig,
  SyncConfigOptimistic,
  SyncConfigServer,
  SyncConfigLambda,
  TransformConfig,
  TransformerProjectConfig,
  AppSyncAuthConfiguration,
  AppSyncAuthConfigurationAPIKeyEntry,
  AppSyncAuthConfigurationEntry,
  AppSyncAuthConfigurationIAMEntry,
  ApiKeyConfig,
  AppSyncAuthConfigurationOIDCEntry,
  AppSyncAuthConfigurationUserPoolEntry,
  AppSyncAuthMode,
  UserPoolConfig,
} from './config/index';
export {
  collectDirectives,
  collectDirectivesByTypeNames,
  DirectiveWrapper,
  getSandboxModeEnvNameFromDirectiveSet,
  getSandboxModeEnvNameFromNodeMap,
} from './utils';
export * from './errors';
export {
  TransformerModelBase,
  TransformerModelEnhancerBase,
  TransformerPluginBase,
  TransformerAuthBase,
} from './transformation/transformer-plugin-base';
/**
 * Returns the extra set of directives that are supported by AppSync service
 */
export const getAppSyncServiceExtraDirectives = (): string => {
  return print(EXTRA_DIRECTIVES_DOCUMENT);
};

export { MappingTemplate } from './cdk-compat';
