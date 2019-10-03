import { DynamoDBDataLoader } from './dynamo-db';
import { NoneDataLoader } from './none';
import { LambdaDataLoader } from './lambda';

export interface AmplifyAppSyncSimulatorDataLoader {
  load(payload: any): Promise<object | null>;
}
const DATA_LOADER_MAP = new Map();
export function getDataLoader(sourceType) {
  if (DATA_LOADER_MAP.has(sourceType)) {
    return DATA_LOADER_MAP.get(sourceType);
  }
  throw new Error(`Unsupported data source type ${sourceType}`);
}

export function addDataLoader(sourceType, loader) {
  if (DATA_LOADER_MAP.has(sourceType)) {
    throw new Error(`Data loader for source ${sourceType} is already registered`);
  }
  DATA_LOADER_MAP.set(sourceType, loader);
}

export function removeDataLoader(sourceType: string) {
  if (DATA_LOADER_MAP.has(sourceType)) {
    const loader = DATA_LOADER_MAP.get(sourceType);
    return DATA_LOADER_MAP.delete(sourceType);
    return loader;
  }
}

// add known data sources
addDataLoader('AMAZON_DYNAMODB', DynamoDBDataLoader);
addDataLoader('NONE', NoneDataLoader);
addDataLoader('AWS_LAMBDA', LambdaDataLoader);
