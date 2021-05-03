import { print } from 'graphql';
import { EXTRA_DIRECTIVES_DOCUMENT } from './transformation/validation';
export {
  GraphQLTransform,
  GraphQLTransformOptions,
  AppSyncAuthConfiguration,
  AppSyncAuthConfigurationAPIKeyEntry,
  AppSyncAuthConfigurationEntry,
  AppSyncAuthConfigurationIAMEntry,
  ApiKeyConfig,
  AppSyncAuthConfigurationOIDCEntry,
  AppSyncAuthConfigurationUserPoolEntry,
  AppSyncAuthMode,
  UserPoolConfig,
} from './transformation';
export { DeploymentResources } from './transformation/types';
export {
  ConflictDetectionType,
  ConflictHandlerType,
  ResolverConfig,
  SyncConfig,
  SyncConfigLambda,
  SyncConfigOptimistic,
  SyncConfigServer,
  TransformConfig,
  TransformerProjectConfig,
} from './config/index';
export { collectDirectives, collectDirectivesByTypeNames, DirectiveWrapper } from './utils';
export * from './errors';
export { TransformerModelBase, TransformerModelEnhancerBase, TransformerPluginBase } from './transformation/transformer-plugin-base';
/**
 * Returns the extra set of directives that are supported by AppSync service
 */
export const getAppSyncServiceExtraDirectives = (): string => {
  return print(EXTRA_DIRECTIVES_DOCUMENT);
};

export { MappingTemplate } from './cdk-compat';
