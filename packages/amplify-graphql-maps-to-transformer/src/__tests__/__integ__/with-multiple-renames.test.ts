import { GraphQLTransform } from '@aws-amplify/graphql-transformer-core';
import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { BelongsToTransformer, HasManyTransformer, HasOneTransformer } from '@aws-amplify/graphql-relational-transformer';
import { MapsToTransformer } from '../../graphql-maps-to-transformer';

test('@mapsTo with multiple foreign key field renames on single model', () => {
  const out = transformSchema(multipleForeignKeyRenmaes);
  const expectedResolvers: string[] = [
    'Mutation.createTodo.postUpdate.1.res.vtl',
    'Mutation.createTodo.init.2.req.vtl',
    'Mutation.updateTodo.postUpdate.1.res.vtl',
    'Mutation.updateTodo.init.2.req.vtl',
    'Query.getTodo.postDataLoad.1.res.vtl',
    'Query.listTodos.postDataLoad.1.res.vtl',
  ];
  expectedResolvers.forEach(resolver => {
    expect(out.resolvers[resolver]).toMatchSnapshot();
  });
});

const multipleForeignKeyRenmaes = /* GraphQL */ `
  type Agenda @model @mapsTo(name: "Checklist") {
    id: ID!
    todos: [Todo] @hasMany
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
    todo: Todo @hasOne
  }
`;

const transformSchema = (schema: string) => {
  const transformer = new GraphQLTransform({
    transformers: [
      new ModelTransformer(),
      new HasManyTransformer(),
      new HasOneTransformer(),
      new BelongsToTransformer(),
      new MapsToTransformer(),
    ],
    sandboxModeEnabled: true,
  });
  return transformer.transform(schema);
};
