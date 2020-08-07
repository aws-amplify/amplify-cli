import { ConflictResolution, PerModelResolutionstrategy, ResolutionStrategy, LambdaResolutionStrategy } from 'amplify-headless-interface';
import { ResolverConfig, SyncConfig, ConflictHandlerType, SyncConfigLAMBDA } from 'graphql-transformer-core';
import _ from 'lodash';

export const conflictResolutionToResolverConfig = (conflictResolution: ConflictResolution = {}): ResolverConfig => {
  const result: ResolverConfig = {};
  if (_.isEmpty(conflictResolution)) return undefined;
  if (conflictResolution.defaultResolutionStrategy) {
    result.project = resolutionStrategyToSyncConfig(conflictResolution.defaultResolutionStrategy);
  }
  if (conflictResolution.perModelResolutionStrategy) {
    result.models = modelSyncConfigTransformer(conflictResolution.perModelResolutionStrategy);
  }
  return result;
};

export const resolverConfigToConflictResolution = (resolverConfig: ResolverConfig = {}): ConflictResolution => {
  const result: ConflictResolution = {};
  if (resolverConfig.project) {
    result.defaultResolutionStrategy = syncConfigToResolutionStrategy(resolverConfig.project);
  }
  if (resolverConfig.models) {
    result.perModelResolutionStrategy = modelResolutionStrategyTransformer(resolverConfig.models);
  }
  return result;
};

const modelSyncConfigTransformer = (perModelResolutionStrategy: PerModelResolutionstrategy[]): { [key: string]: SyncConfig } => {
  const result: { [key: string]: SyncConfig } = {};
  perModelResolutionStrategy.forEach(
    strategy => (result[strategy.entityName] = resolutionStrategyToSyncConfig(strategy.resolutionStrategy)),
  );
  return result;
};

const modelResolutionStrategyTransformer = (modelSyncConfig: { [key: string]: SyncConfig }): PerModelResolutionstrategy[] => {
  const result: PerModelResolutionstrategy[] = [];
  Object.entries(modelSyncConfig)
    .map(
      ([key, value]): PerModelResolutionstrategy => ({
        resolutionStrategy: syncConfigToResolutionStrategy(value),
        entityName: key,
      }),
    )
    .forEach(modelStrategy => result.push(modelStrategy));
  return result;
};

const resolutionStrategyToSyncConfig = (resolutionStrategy: ResolutionStrategy, newFunctionMap?: Record<string, string>): SyncConfig => {
  const defaultMapper = () => undefined;
  return _.get(resolutionStrategyToSyncConfigMap, resolutionStrategy.type, defaultMapper)(resolutionStrategy);
};

const resolutionStrategyToSyncConfigMap: Record<string, (rs: ResolutionStrategy) => SyncConfig> = {
  AUTOMERGE: () => ({
    ConflictHandler: ConflictHandlerType.AUTOMERGE,
    ConflictDetection: 'VERSION',
  }),
  OPTIMISTIC_CONCURRENCY: () => ({
    ConflictHandler: ConflictHandlerType.OPTIMISTIC,
    ConflictDetection: 'VERSION',
  }),
  LAMBDA: (resolutionStrategy: LambdaResolutionStrategy) => {
    switch (resolutionStrategy.resolver.type) {
      case 'EXISTING':
        const { name, region, arn } = resolutionStrategy.resolver;
        return {
          ConflictHandler: ConflictHandlerType.LAMBDA,
          ConflictDetection: 'VERSION',
          LambdaConflictHandler: { name, region, lambdaArn: arn },
        };
      case 'NEW':
        throw new Error(
          'Tried to convert LambdaResolutionStrategy "NEW" to SyncConfig. New resources must be generated prior to this conversion and then replaced with a LambdaResolutionStrategy of type "EXISTING"',
        );
    }
  },
};

const syncConfigToResolutionStrategy = (syncConfig: SyncConfig): ResolutionStrategy => {
  const defaultMapper = (): ResolutionStrategy => ({ type: 'NONE' });
  return _.get(syncConfigToResolutionStrategyMap, syncConfig.ConflictHandler, defaultMapper)(syncConfig);
};

const syncConfigToResolutionStrategyMap: Record<ConflictHandlerType, (sc: SyncConfig) => ResolutionStrategy> = {
  AUTOMERGE: () => ({
    type: 'AUTOMERGE',
  }),
  OPTIMISTIC_CONCURRENCY: () => ({
    type: 'OPTIMISTIC_CONCURRENCY',
  }),
  LAMBDA: (syncConfig: SyncConfigLAMBDA) => ({
    type: 'LAMBDA',
    resolver: (syncConfig.LambdaConflictHandler as any).new
      ? {
          // this is a hack to pass the "new" flag into the ResolutionStrategy
          type: 'NEW',
        }
      : {
          type: 'EXISTING',
          name: syncConfig.LambdaConflictHandler.name,
          region: syncConfig.LambdaConflictHandler.region,
          arn: syncConfig.LambdaConflictHandler.lambdaArn,
        },
  }),
};
