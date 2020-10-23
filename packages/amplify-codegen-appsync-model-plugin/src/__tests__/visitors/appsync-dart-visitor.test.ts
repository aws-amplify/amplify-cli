import { buildSchema, GraphQLSchema, parse, visit } from 'graphql';
import { directives, scalars } from '../../scalars/supported-directives';
import { AppSyncModelDartVisitor } from '../../visitors/appsync-dart-visitor';
import { CodeGenGenerateEnum } from '../../visitors/appsync-visitor';
import { DART_SCALAR_MAP } from '../../scalars';

const buildSchemaWithDirectives = (schema: String): GraphQLSchema => {
  return buildSchema([schema, directives, scalars].join('\n'));
};

const getVisitor = (schema: string, selectedType?: string, generate: CodeGenGenerateEnum = CodeGenGenerateEnum.code) => {
  const ast = parse(schema);
  const builtSchema = buildSchemaWithDirectives(schema);
  const visitor = new AppSyncModelDartVisitor(
    builtSchema,
    { directives, target: 'dart', generate, scalars: DART_SCALAR_MAP },
    { selectedType },
  );
  visit(ast, { leave: visitor });
  return visitor;
};

describe('AppSyncModelVisitor', () => {
  const schema = /* GraphQL */ `
    type Blog @model {
      id: ID!
      name: String!
      posts: [Post] @connection(keyName: "byBlog", fields: ["id"])
    }
    type Comment @model @key(name: "byPost", fields: ["postID", "content"]) {
      id: ID!
      postID: ID!
      post: Post @connection(fields: ["postID"])
      content: String!
    }
    type Post @model @key(name: "byBlog", fields: ["blogID"]) {
      id: ID!
      title: String!
      blogID: ID!
      blog: Blog @connection(fields: ["blogID"])
      comments: [Comment] @connection(keyName: "byPost", fields: ["id"])
    }
  `;

  it('Should generate classes for models', () => {
    const visitor = getVisitor(schema);
    const generatedCode = visitor.generate();  });
});
