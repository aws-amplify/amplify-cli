import { ConflictHandlerType, GraphQLTransform } from '@aws-amplify/graphql-transformer-core';
import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { BelongsToTransformer, HasManyTransformer, HasOneTransformer } from '@aws-amplify/graphql-relational-transformer';
import { MapsToTransformer } from '../../graphql-maps-to-transformer';
import { expectedResolversForModelWithRenamedField } from './common';

const originalSchema = /* GraphQL */ `
  type Checklist @model {
    id: ID!
    tasks: [Task] @hasMany
  }

  type Task @model {
    id: ID!
    title: String!
    loc: Location @hasOne
    day: Day @belongsTo
  }

  type Location @model {
    id: ID!
    name: String
  }

  type Day @model {
    id: ID!
    task: Task @hasOne
  }
`;

const multipleForeignKeyRenames = /* GraphQL */ `
  type Agenda @model @mapsTo(name: "Checklist") {
    id: ID!
    tasks: [Todo] @hasMany
  }

  type Todo @model @mapsTo(name: "Task") {
    id: ID!
    title: String!
    loc: Location @hasOne
    day: Day @belongsTo
  }

  type Location @model {
    id: ID!
    name: String
  }

  type Day @model {
    id: ID!
    task: Todo @hasOne
  }
`;

const transformSchema = (schema: string, enableDataStore = false) => {
  const transformer = new GraphQLTransform({
    transformers: [
      new ModelTransformer(),
      new HasManyTransformer(),
      new HasOneTransformer(),
      new BelongsToTransformer(),
      new MapsToTransformer(),
    ],
    sandboxModeEnabled: true,
    resolverConfig: enableDataStore
      ? {
          project: {
            ConflictDetection: 'VERSION',
            ConflictHandler: ConflictHandlerType.AUTOMERGE,
          },
        }
      : undefined,
  });
  return transformer.transform(schema);
};

test('@mapsTo with multiple foreign key field renames on single model', () => {
  const out = transformSchema(multipleForeignKeyRenames);
  const expectedUndefinedResovlers = ['Location', 'Day', 'Agenda'].flatMap(expectedResolversForModelWithRenamedField);
  expectedUndefinedResovlers.forEach(resolver => expect(out.resolvers[resolver]).toBeUndefined());

  const expectedRemappingResolvers = ['Todo'].flatMap(expectedResolversForModelWithRenamedField);
  expectedRemappingResolvers.forEach(resolver => {
    expect(out.resolvers[resolver]).toMatchSnapshot();
  });
});

test('maps-to-transformer does not apply any resolvers to non-mapped models', () => {
  const out = transformSchema(originalSchema);
  const expectUndefinedResolversList = ['Checklist', 'Task', 'Location', 'Day'].flatMap(expectedResolversForModelWithRenamedField);
  expectUndefinedResolversList.forEach(resolver => expect(out.resolvers[resolver]).toBeUndefined());
});

test('maps sync resolvers when DataStore is enabled', () => {
  const out = transformSchema(multipleForeignKeyRenames, true);
  const expectedSyncResolverNames = (modelName: string) => [
    `Query.sync${modelName}s.preDataLoad.1.req.vtl`,
    `Query.sync${modelName}s.preDataLoad.1.res.vtl`,
    `Query.sync${modelName}s.postDataLoad.1.res.vtl`,
  ];
  const expectedSyncResolvers = ['Todo'].flatMap(expectedSyncResolverNames);
  expectedSyncResolvers.forEach(resolver => expect(out.resolvers[resolver]).toMatchSnapshot());
});
