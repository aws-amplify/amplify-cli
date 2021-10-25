import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { GraphQLTransform } from '@aws-amplify/graphql-transformer-core';
import { MapsToTransformer } from '@aws-amplify/graphql-maps-to-transformer';
import { SearchableModelTransformer } from '@aws-amplify/graphql-searchable-transformer';

describe('@mapsTo directive', () => {
  it('generates table name with mapped name', () => {
    const basicSchema = /* GraphQL */ `
      type Todo @model @mapsTo(name: "Task") {
        id: ID!
        title: String!
      }
    `;
    const transformer = new GraphQLTransform({
      transformers: [new ModelTransformer(), new MapsToTransformer()],
      sandboxModeEnabled: true,
    });
    const out = transformer.transform(basicSchema);
    expect(out.stacks.Task.Resources.TaskTable.Properties.TableName).toMatchInlineSnapshot(`
      Object {
        "Fn::Join": Array [
          "",
          Array [
            "Task-",
            Object {
              "Ref": "referencetotransformerrootstackGraphQLAPI20497F53ApiId",
            },
            "-",
            Object {
              "Ref": "referencetotransformerrootstackenv10C5A902Ref",
            },
          ],
        ],
      }
    `);
    expect(out.stacks.Task.Outputs.GetAttTaskTableName).toMatchInlineSnapshot(`
      Object {
        "Description": "Your DynamoDB table name.",
        "Export": Object {
          "Name": Object {
            "Fn::Join": Array [
              ":",
              Array [
                Object {
                  "Ref": "referencetotransformerrootstackGraphQLAPI20497F53ApiId",
                },
                "GetAtt:TaskTable:Name",
              ],
            ],
          },
        },
        "Value": Object {
          "Ref": "TaskTable",
        },
      }
    `);
  });

  it('generates searchable resolvers with original index name', async () => {
    const searchableSchema = /* GraphQL */ `
      type Todo @model @mapsTo(name: "Task") @searchable {
        id: ID!
        title: String!
      }
    `;
    const transformer = new GraphQLTransform({
      transformers: [new ModelTransformer(), new MapsToTransformer(), new SearchableModelTransformer()],
      sandboxModeEnabled: true,
    });
    const out = transformer.transform(searchableSchema);
    expect(out.pipelineFunctions['Query.searchTodos.req.vtl'].startsWith('#set( $indexPath = "/task/doc/_search" )')).toBe(true);
    expect(
      Object.values(out.stacks.SearchableStack.Resources).find(resource => resource.Type === 'AWS::Lambda::EventSourceMapping').Properties
        .EventSourceArn.Ref,
    ).toMatchInlineSnapshot(
      `"referencetotransformerrootstackTaskNestedStackTaskNestedStackResource8AC104EFOutputstransformerrootstackTaskTaskTableD1773550StreamArn"`,
    );
  });
});
