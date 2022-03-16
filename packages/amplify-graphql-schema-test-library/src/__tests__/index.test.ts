import { AuthTransformer } from '@aws-amplify/graphql-auth-transformer';
import { DefaultValueTransformer } from '@aws-amplify/graphql-default-value-transformer';
import { FunctionTransformer } from '@aws-amplify/graphql-function-transformer';
import { HttpTransformer } from '@aws-amplify/graphql-http-transformer';
import { IndexTransformer, PrimaryKeyTransformer } from '@aws-amplify/graphql-index-transformer';
import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { PredictionsTransformer } from '@aws-amplify/graphql-predictions-transformer';
import {
  BelongsToTransformer,
  HasManyTransformer,
  HasOneTransformer,
  ManyToManyTransformer,
} from '@aws-amplify/graphql-relational-transformer';
import { SearchableModelTransformer } from '@aws-amplify/graphql-searchable-transformer';
import { ConflictHandlerType, GraphQLTransform, GraphQLTransformOptions } from '@aws-amplify/graphql-transformer-core';
import { TransformerPluginProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { schemas, TransformerPlatform, TransformerSchema, TransformerVersion } from '..';
type Writeable<T> = { -readonly [P in keyof T]: T[P] };
const defaultDataStoreConfig = {
  resolverConfig: {
    project: {
      ConflictDetection: 'VERSION',
      ConflictHandler: ConflictHandlerType.AUTOMERGE,
    },
  },
} as any;

for (const [name, schema] of Object.entries(schemas)) {
  test(`schema '${name}' passes or fails as expected`, () => {
    if (!isTransformerVersionSupported(schema, TransformerVersion.v2)) {
      throw new Error('only v2 schemas are currently supported');
    }

    if (isPlatformSupported(schema, TransformerPlatform.api)) {
      expectToPass(name, schema, createV2Transformer());
    } else {
      expectToFail(name, schema, createV2Transformer());
    }

    if (isPlatformSupported(schema, TransformerPlatform.dataStore)) {
      expectToPass(name, schema, createV2Transformer({ ...defaultDataStoreConfig }));
    } else {
      expectToFail(name, schema, createV2Transformer({ ...defaultDataStoreConfig }));
    }
  });
}

function expectToPass(name: string, schema: TransformerSchema, transformer: GraphQLTransform): void {
  try {
    transformer.transform(schema.sdl);
  } catch (err) {
    console.log(err);
    throw new Error(`schema '${name}' unexpectedly failed with error: ${err}`);
  }
}

function expectToFail(name: string, schema: TransformerSchema, transformer: GraphQLTransform): void {
  try {
    transformer.transform(schema.sdl);
  } catch (err) {
    return;
  }

  throw new Error(`schema '${name}' unexpectedly passed`);
}

function createV2Transformer(options: Partial<Writeable<GraphQLTransformOptions>> = {}): GraphQLTransform {
  options.transformers ??= getV2DefaultTransformerList();

  return new GraphQLTransform(options as GraphQLTransformOptions);
}

function getV2DefaultTransformerList(): TransformerPluginProvider[] {
  const modelTransformer = new ModelTransformer();
  const indexTransformer = new IndexTransformer();
  const hasOneTransformer = new HasOneTransformer();
  const authTransformer = new AuthTransformer({
    adminRoles: ['testAdminRoleName'],
    identityPoolId: 'identityPoolId',
  });

  return [
    modelTransformer,
    new FunctionTransformer(),
    new HttpTransformer(),
    new PredictionsTransformer({ bucketName: 'testBucketName' }),
    new PrimaryKeyTransformer(),
    indexTransformer,
    new BelongsToTransformer(),
    new HasManyTransformer(),
    hasOneTransformer,
    new ManyToManyTransformer(modelTransformer, indexTransformer, hasOneTransformer, authTransformer),
    new DefaultValueTransformer(),
    authTransformer,
    new SearchableModelTransformer(),
  ];
}

function isTransformerVersionSupported(schema: TransformerSchema, version: TransformerVersion): boolean {
  return (schema.transformerVersion & version) !== 0;
}

function isPlatformSupported(schema: TransformerSchema, platform: TransformerPlatform): boolean {
  return (schema.supportedPlatforms & platform) !== 0;
}
