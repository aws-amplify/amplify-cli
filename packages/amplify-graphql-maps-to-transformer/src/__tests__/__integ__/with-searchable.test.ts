import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { GraphQLTransform } from '@aws-amplify/graphql-transformer-core';
import { MapsToTransformer } from '@aws-amplify/graphql-maps-to-transformer';
import { HasManyTransformer } from '@aws-amplify/graphql-relational-transformer';
import { SearchableModelTransformer } from '@aws-amplify/graphql-searchable-transformer';

const mappedSearchableSchema = /* GraphQL */ `
  type Agenda @model {
    id: ID!
    todos: [Todo] @hasMany
  }

  type Todo @model @mapsTo(name: "Task") @searchable {
    id: ID!
    title: String!
  }
`;

const mappedHasManyAndSearchableSchema = /* GraphQL */ `
  type Agenda @model @mapsTo(name: "Checklist") {
    id: ID!
    todos: [Todo] @hasMany
  }

  type Todo @model @mapsTo(name: "Task") @searchable {
    id: ID!
    title: String!
  }
`;

const transformSchema = (schema: string) => {
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new HasManyTransformer(), new SearchableModelTransformer(), new MapsToTransformer()],
    sandboxModeEnabled: true,
  });
  return transformer.transform(schema);
};

describe('mapsTo with searchable', () => {
  it('generates searchable resolvers with original index name', () => {
    const out = transformSchema(mappedSearchableSchema);
    const searchResolverLines = out.resolvers['Query.searchTodos.req.vtl'].split('\n');
    expect(searchResolverLines[0]).toMatchInlineSnapshot(`"#set( $args = $util.defaultIfNull($ctx.stash.transformedArgs, $ctx.args) )"`);
    expect(searchResolverLines[1].startsWith('#set( $indexPath = "/task/_search" )')).toBe(true);
  });

  it('references original table in sreaming function', () => {
    const out = transformSchema(mappedSearchableSchema);
    expect(
      Object.values(out.stacks.SearchableStack.Resources!).find(resource => resource.Type === 'AWS::Lambda::EventSourceMapping').Properties
        .EventSourceArn.Ref,
    ).toMatchInlineSnapshot(
      `"referencetotransformerrootstackTaskNestedStackTaskNestedStackResource8AC104EFOutputstransformerrootstackTaskTaskTableD1773550StreamArn"`,
    );
  });

  it('adds mapping slots if searchable model has renamed field', () => {
    const out = transformSchema(mappedHasManyAndSearchableSchema);
    const expectedSearchResolverNames = (modelName: string) => [
      `Query.search${modelName}s.preDataLoad.1.req.vtl`,
      `Query.search${modelName}s.preDataLoad.1.res.vtl`,
      `Query.search${modelName}s.postDataLoad.1.res.vtl`,
    ];
    const expectedSyncResolvers = ['Todo'].flatMap(expectedSearchResolverNames);
    expectedSyncResolvers.forEach(resolver => expect(out.resolvers[resolver]).toMatchSnapshot());
  });
});
