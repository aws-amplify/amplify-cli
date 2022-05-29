import { DynamoDBModelTransformer } from 'graphql-dynamodb-transformer';
import { ModelConnectionTransformer } from 'graphql-connection-transformer';
import { VersionedModelTransformer } from 'graphql-versioned-transformer';
import { ModelAuthTransformer } from 'graphql-auth-transformer';
import { HttpTransformer } from 'graphql-http-transformer';
import { KeyTransformer } from 'graphql-key-transformer';
import { GraphQLTransform } from 'graphql-transformer-core';
import { featureFlagProviderStub } from './feature-flag-stub';
import { V1TransformerTestConfig } from './test-case-types';

export const v1transformerProvider = (config: Partial<V1TransformerTestConfig> = {}): GraphQLTransform => {
  const subbedConfig: V1TransformerTestConfig = { ...getDefaultConfig(), ...config };

  return new GraphQLTransform({
    transformers: subbedConfig.transformers,
    transformConfig: {
      Version: 5,
    },
    featureFlags: featureFlagProviderStub,
  });
};

const getDefaultConfig = (): V1TransformerTestConfig => ({
  transformers: [
    new DynamoDBModelTransformer(),
    new VersionedModelTransformer(),
    new HttpTransformer(),
    new KeyTransformer(),
    new ModelConnectionTransformer(),
    new ModelAuthTransformer({
      authConfig: {
        defaultAuthentication: {
          authenticationType: 'API_KEY',
        },
        additionalAuthenticationProviders: [
          {
            authenticationType: 'AWS_IAM',
          },
          {
            authenticationType: 'AMAZON_COGNITO_USER_POOLS',
          },
        ],
      },
    }),
  ],
});
