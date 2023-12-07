import { AppSyncAuthConfiguration, TransformerPluginProvider, TransformerLogLevel } from '@aws-amplify/graphql-transformer-interfaces';
import type {
  ModelDataSourceStrategy,
  RDSLayerMappingProvider,
  SqlDirectiveDataSourceStrategy,
  SynthParameters,
  TransformParameters,
} from '@aws-amplify/graphql-transformer-interfaces';
import {
  DDB_DEFAULT_DATASOURCE_STRATEGY,
  GraphQLTransform,
  ResolverConfig,
  UserDefinedSlot,
  constructDataSourceStrategies,
} from '@aws-amplify/graphql-transformer-core';
import { TransformManager, DeploymentResources } from '../../__e2e_v2__/test-synthesizer';

export type TestTransformParameters = RDSLayerMappingProvider & {
  authConfig?: AppSyncAuthConfiguration;
  // Making this optional so test code can simply use a default DDB strategy for each model in the schema.
  dataSourceStrategies?: Record<string, ModelDataSourceStrategy>;
  resolverConfig?: ResolverConfig;
  schema: string;
  sqlDirectiveDataSourceStrategies?: SqlDirectiveDataSourceStrategy[];
  stackMapping?: Record<string, string>;
  synthParameters?: Partial<SynthParameters>;
  transformers: TransformerPluginProvider[];
  transformParameters?: Partial<TransformParameters>;
  userDefinedSlots?: Record<string, UserDefinedSlot[]>;
};

/**
 * This mirrors the old behavior of the graphql transformer, where we fully synthesize internally, for the purposes of
 * unit testing, and to introduce fewer changes during the refactor.
 */
export const testTransform = (params: TestTransformParameters): DeploymentResources & { logs: any[] } => {
  const {
    authConfig,
    dataSourceStrategies,
    resolverConfig,
    schema,
    rdsLayerMapping,
    sqlDirectiveDataSourceStrategies,
    stackMapping,
    synthParameters: overrideSynthParameters,
    transformers,
    transformParameters,
    userDefinedSlots,
  } = params;

  const transform = new GraphQLTransform({
    transformers,
    stackMapping,
    authConfig,
    transformParameters,
    userDefinedSlots,
    resolverConfig,
  });

  const transformManager = new TransformManager();

  const authConfigTypes = [authConfig?.defaultAuthentication, ...(authConfig?.additionalAuthenticationProviders ?? [])].map(
    (authConfigEntry) => authConfigEntry?.authenticationType,
  );

  transform.transform({
    scope: transformManager.getTransformScope(),
    nestedStackProvider: transformManager.getNestedStackProvider(),
    assetProvider: transformManager.getAssetProvider(),
    synthParameters: {
      ...transformManager.getSynthParameters(
        authConfigTypes.some((type) => type === 'AWS_IAM'),
        authConfigTypes.some((type) => type === 'AMAZON_COGNITO_USER_POOLS'),
      ),
      ...overrideSynthParameters,
    },
    schema,
    rdsLayerMapping,
    dataSourceStrategies: dataSourceStrategies ?? constructDataSourceStrategies(schema, DDB_DEFAULT_DATASOURCE_STRATEGY),
    sqlDirectiveDataSourceStrategies,
  });

  const logs: any[] = [];

  transform.getLogs().forEach((log) => {
    logs.push(log);
    switch (log.level) {
      case TransformerLogLevel.ERROR:
        console.error(log.message);
        break;
      case TransformerLogLevel.WARN:
        console.warn(log.message);
        break;
      case TransformerLogLevel.INFO:
        console.info(log.message);
        break;
      case TransformerLogLevel.DEBUG:
        console.debug(log.message);
        break;
      default:
        console.error(log.message);
    }
  });

  return {
    ...transformManager.generateDeploymentResources(),
    logs,
  };
};
