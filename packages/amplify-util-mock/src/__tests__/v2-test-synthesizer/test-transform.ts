import {
  AppSyncAuthConfiguration,
  TransformerPluginProvider,
  TransformerLogLevel,
  DataSourceType,
} from '@aws-amplify/graphql-transformer-interfaces';
import type { SynthParameters, TransformParameters } from '@aws-amplify/graphql-transformer-interfaces';
import { GraphQLTransform, RDSConnectionSecrets, ResolverConfig, UserDefinedSlot } from '@aws-amplify/graphql-transformer-core';
import { TransformManager, DeploymentResources } from '../../__e2e_v2__/test-synthesizer';

export type TestTransformParameters = {
  transformers: TransformerPluginProvider[];
  schema: string;
  transformParameters?: Partial<TransformParameters>;
  resolverConfig?: ResolverConfig;
  authConfig?: AppSyncAuthConfiguration;
  userDefinedSlots?: Record<string, UserDefinedSlot[]>;
  stackMapping?: Record<string, string>;
  modelToDatasourceMap?: Map<string, DataSourceType>;
  datasourceSecretParameterLocations?: Map<string, RDSConnectionSecrets>;
  synthParameters?: Partial<SynthParameters>;
};

/**
 * This mirrors the old behavior of the graphql transformer, where we fully synthesize internally, for the purposes of
 * unit testing, and to introduce fewer changes during the refactor.
 */
export const testTransform = (params: TestTransformParameters): DeploymentResources & { logs: any[] } => {
  const {
    schema,
    modelToDatasourceMap,
    datasourceSecretParameterLocations,
    transformers,
    authConfig,
    resolverConfig,
    userDefinedSlots,
    stackMapping,
    transformParameters,
    synthParameters: overrideSynthParameters,
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
    datasourceConfig: {
      modelToDatasourceMap,
      datasourceSecretParameterLocations,
    },
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
