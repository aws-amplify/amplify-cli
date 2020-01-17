import './polyfills/Object.assign';
import { print } from 'graphql';
import { TransformerContext } from './TransformerContext';
import { Transformer } from './Transformer';
import { ITransformer } from './ITransformer';
import { GraphQLTransform } from './GraphQLTransform';
import { collectDirectiveNames, collectDirectivesByTypeNames } from './collectDirectives';
import { stripDirectives } from './stripDirectives';
import { DeploymentResources } from './DeploymentResources';
import {
  buildProject as buildAPIProject,
  uploadDeployment as uploadAPIProject,
  migrateAPIProject,
  revertAPIMigration,
} from './util/amplifyUtils';
import {
  readSchema as readProjectSchema,
  loadProject as readProjectConfiguration,
  loadConfig as readTransformerConfiguration,
  writeConfig as writeTransformerConfiguration,
  TRANSFORM_CONFIG_FILE_NAME,
  TRANSFORM_BASE_VERSION,
  TRANSFORM_CURRENT_VERSION,
  TransformConfig,
  SyncConfig,
} from './util/transformConfig';
import { EXTRA_DIRECTIVES_DOCUMENT } from './validation';

export * from './errors';
export * from './util';

/**
 * Returns the extra set of directives that are supported by AppSync service
 */
export function getAppSyncServiceExtraDirectives(): string {
  return print(EXTRA_DIRECTIVES_DOCUMENT);
}

export {
  GraphQLTransform,
  TransformConfig,
  TransformerContext,
  Transformer,
  ITransformer,
  collectDirectiveNames,
  collectDirectivesByTypeNames,
  stripDirectives,
  buildAPIProject,
  migrateAPIProject,
  uploadAPIProject,
  readProjectSchema,
  readProjectConfiguration,
  readTransformerConfiguration,
  writeTransformerConfiguration,
  revertAPIMigration,
  TRANSFORM_CONFIG_FILE_NAME,
  TRANSFORM_BASE_VERSION,
  TRANSFORM_CURRENT_VERSION,
  SyncConfig,
  DeploymentResources,
};
