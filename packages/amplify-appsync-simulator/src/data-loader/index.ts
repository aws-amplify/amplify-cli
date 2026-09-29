import { DynamoDBDataLoader } from './dynamo-db';
import { NoneDataLoader } from './none';
import { LambdaDataLoader } from './lambda';
import { OpenSearchDataLoader } from './opensearch';

import { AppSyncSimulatorDataSourceConfig, AppSyncSimulatorDataSourceType } from '../type-definition';
export interface AmplifyAppSyncSimulatorDataLoader {
  load(payload: any, extraData?: any): Promise<object | null>;
}
const DATA_LOADER_MAP = new Map<
  AppSyncSimulatorDataSourceType,
  new (config?: AppSyncSimulatorDataSourceConfig) => AmplifyAppSyncSimulatorDataLoader
>();
export function getDataLoader(sourceType) {
  if (DATA_LOADER_MAP.has(sourceType)) {
    return DATA_LOADER_MAP.get(sourceType);
  }
  throw new Error(`Unsupported data source type ${sourceType}`);
}

export function addDataLoader(
  sourceType: AppSyncSimulatorDataSourceType,
  loader: new (config?: AppSyncSimulatorDataSourceConfig) => AmplifyAppSyncSimulatorDataLoader,
) {
  if (DATA_LOADER_MAP.has(sourceType)) {
    throw new Error(`Data loader for source ${sourceType} is already registered`);
  }
  DATA_LOADER_MAP.set(sourceType, loader);
}

export function removeDataLoader(sourceType: AppSyncSimulatorDataSourceType) {
  return DATA_LOADER_MAP.delete(sourceType);
}

// add known data sources
// @ts-expect-error Type 'AppSyncSimulatorDataSourceConfig' is not assignable to type 'DynamoDBLoaderConfig'
addDataLoader(AppSyncSimulatorDataSourceType.DynamoDB, DynamoDBDataLoader);
addDataLoader(AppSyncSimulatorDataSourceType.None, NoneDataLoader);
addDataLoader(AppSyncSimulatorDataSourceType.Lambda, LambdaDataLoader);
addDataLoader(AppSyncSimulatorDataSourceType.OpenSearch, OpenSearchDataLoader);
