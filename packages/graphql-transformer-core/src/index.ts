import './polyfills/Object.assign';
import { TransformerContext } from './TransformerContext';
import { Transformer } from './Transformer';
import { ITransformer } from './ITransformer';
import { GraphQLTransform } from './GraphQLTransform';
import { collectDirectiveNames, collectDirectivesByTypeNames } from './collectDirectives';
import { stripDirectives } from './stripDirectives';
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

export * from './errors';
export * from './util';

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
};
