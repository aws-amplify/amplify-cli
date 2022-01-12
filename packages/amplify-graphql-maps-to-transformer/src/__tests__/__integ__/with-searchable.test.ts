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
    expect(out.resolvers['Query.searchTodos.req.vtl'].startsWith('#set( $indexPath = "/task/doc/_search" )')).toBe(true);
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

  it('adds postDataLoad mapping slot if searchable model has renamed field', () => {
    const out = transformSchema(mappedHasManyAndSearchableSchema);
    expect(out.resolvers['Query.searchTodos.postDataLoad.1.res.vtl']).toMatchInlineSnapshot(`
      "#foreach( $item in $ctx.prev.result.items )
        $util.qr($item.put(\\"agendaTodosId\\", $item.checklistTodosId))
        $util.qr($item.remove(\\"checklistTodosId\\"))
      #end
      $util.toJson($ctx.prev.result)"
    `);
  });
});
