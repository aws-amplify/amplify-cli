import { ConflictHandlerType, GraphQLTransform } from '@aws-amplify/graphql-transformer-core';
import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { BelongsToTransformer, HasManyTransformer, HasOneTransformer } from '@aws-amplify/graphql-relational-transformer';
import { MapsToTransformer } from '../../graphql-maps-to-transformer';

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

const crudResolvers = (modelName: string) => [
  `Mutation.create${modelName}.postUpdate.1.res.vtl`,
  `Mutation.create${modelName}.init.2.req.vtl`,
  `Mutation.update${modelName}.postUpdate.1.res.vtl`,
  `Mutation.update${modelName}.init.2.req.vtl`,
  `Query.get${modelName}.postDataLoad.1.res.vtl`,
  `Query.list${modelName}s.postDataLoad.1.res.vtl`,
];

test('@mapsTo with multiple foreign key field renames on single model', () => {
  const out = transformSchema(multipleForeignKeyRenames);
  const expectedUndefinedResovlers = ['Location', 'Day', 'Agenda'].flatMap(crudResolvers);
  expectedUndefinedResovlers.forEach(resolver => expect(out.resolvers[resolver]).toBeUndefined());

  const expectedRemappingResolvers = ['Todo'].flatMap(crudResolvers);
  expectedRemappingResolvers.forEach(resolver => {
    expect(out.resolvers[resolver]).toMatchSnapshot();
  });
});

test('maps-to-transformer does not apply any resolvers to non-mapped models', () => {
  const out = transformSchema(originalSchema);
  const expectUndefinedResolversList = ['Checklist', 'Task', 'Location', 'Day'].flatMap(crudResolvers);
  expectUndefinedResolversList.forEach(resolver => expect(out.resolvers[resolver]).toBeUndefined());
});

test('maps sync resolvers when DataStore is enabled', () => {
  const out = transformSchema(multipleForeignKeyRenames, true);
  const expectedSyncResolvers = ['Todo'].map(type => `Query.sync${type}s.postDataLoad.1.res.vtl`);
  expectedSyncResolvers.forEach(resolver => expect(out.resolvers[resolver]).toMatchSnapshot());
});
