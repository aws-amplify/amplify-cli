import { GraphQLTransform } from '@aws-amplify/graphql-transformer-core';
import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { AuthTransformer } from '@aws-amplify/graphql-auth-transformer';
import { FunctionTransformer } from '@aws-amplify/graphql-function-transformer';
import { HttpTransformer } from '@aws-amplify/graphql-http-transformer';
import { IndexTransformer, PrimaryKeyTransformer } from '@aws-amplify/graphql-index-transformer';
import {
  BelongsToTransformer,
  HasManyTransformer,
  HasOneTransformer,
  ManyToManyTransformer,
} from '@aws-amplify/graphql-relational-transformer';
import { DefaultValueTransformer } from '@aws-amplify/graphql-default-value-transformer';
import { TransformerPluginProvider, AppSyncAuthConfiguration } from '@aws-amplify/graphql-transformer-interfaces';
import { V2TransformerTestConfig } from './test-case-types';

export const v2transformerProvider = (config: Partial<V2TransformerTestConfig> = {}): GraphQLTransform => {
  const transform = new GraphQLTransform({
    transformers: config.transformers ?? getDefaultTransformers(),
    authConfig: defaultAuthConfig,
    sandboxModeEnabled: true,
  });

  return transform;
};

const getDefaultTransformers = () => {
  const modelTransformer = new ModelTransformer();
  const indexTransformer = new IndexTransformer();
  const hasOneTransformer = new HasOneTransformer();

  const authTransformer = new AuthTransformer();
  const transformers: TransformerPluginProvider[] = [
    modelTransformer,
    new FunctionTransformer(),
    new HttpTransformer(),
    new PrimaryKeyTransformer(),
    indexTransformer,
    new BelongsToTransformer(),
    new HasManyTransformer(),
    hasOneTransformer,
    new ManyToManyTransformer(modelTransformer, indexTransformer, hasOneTransformer, authTransformer),
    new DefaultValueTransformer(),
    authTransformer,
  ];

  return transformers;
};

const defaultAuthConfig: AppSyncAuthConfiguration = {
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
};
