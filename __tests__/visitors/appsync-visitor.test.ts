import { buildSchema, visit, parse } from 'graphql';
import { AppSyncModelVisitor, CodeGenGenerateEnum } from '../../src/visitors/appsync-visitor';
import { directives } from '../../src/scalars/supported-directives';
import { TYPESCRIPT_SCALAR_MAP } from '../../src/scalars';

const buildSchemaWithDirectives = (schema: String) => {
  return buildSchema([schema, directives].join('\n'));
};
describe('AppSyncModelVisitor', () => {
  it('should support schema without id', () => {
    const schema = /* GraphQL */ `
      enum Status {
        draft
        inReview
        published
      }
      type Post @model {
        title: String!
        content: String
        comments: [Comment] @connection
        status: Status!
      }

      type Comment @model {
        comment: String!
        post: Post @connection
      }
    `;
    const ast = parse(schema);
    const builtSchema = buildSchemaWithDirectives(schema);
    const visitor = new AppSyncModelVisitor(builtSchema, { directives, target: 'android', generate: CodeGenGenerateEnum.code }, {});
    visit(ast, { leave: visitor });
    expect(visitor.types.Post).toBeDefined();
    const postFields = visitor.types.Post.fields;
    // ID
    expect(postFields[0].name).toEqual('id');
    expect(postFields[0].type).toEqual('ID');
    expect(postFields[0].isNullable).toEqual(false);
    expect(postFields[0].isList).toEqual(false);

    // title
    expect(postFields[1].name).toEqual('title');
    expect(postFields[1].type).toEqual('String');
    expect(postFields[1].isNullable).toEqual(false);
    expect(postFields[1].isList).toEqual(false);

    // content
    expect(postFields[2].name).toEqual('content');
    expect(postFields[2].type).toEqual('String');
    expect(postFields[2].isNullable).toEqual(true);
    expect(postFields[2].isList).toEqual(false);
    // comments
    expect(postFields[3].name).toEqual('comments');
    expect(postFields[3].type).toEqual('Comment');
    expect(postFields[3].isNullable).toEqual(true);
    expect(postFields[3].isList).toEqual(true);

    // Status
    expect(postFields[4].name).toEqual('status');
    expect(postFields[4].type).toEqual('Status');
    expect(postFields[4].isNullable).toEqual(false);
    expect(postFields[4].isList).toEqual(false);

    // Enums
    expect(visitor.enums.Status).toBeDefined();
    expect(visitor.enums.Status.values).toEqual({ DRAFT: 'draft', IN_REVIEW: 'inReview', PUBLISHED: 'published' });
  });

  it('should support schema with id', () => {
    const schema = /* GraphQL */ `
      type Post @model {
        id: ID!
        title: String!
        content: String!
      }
    `;
    const ast = parse(schema);
    const builtSchema = buildSchemaWithDirectives(schema);
    const visitor = new AppSyncModelVisitor(builtSchema, { directives, target: 'android', generate: CodeGenGenerateEnum.code }, {});
    visit(ast, { leave: visitor });
    expect(visitor.types.Post).toBeDefined();

    const postFields = visitor.types.Post.fields;
    expect(postFields[0].name).toEqual('id');
    expect(postFields[0].type).toEqual('ID');
    expect(postFields[0].isNullable).toEqual(false);
    expect(postFields[0].isList).toEqual(false);
  });

  it('should throw error when schema has id of Non ID type', () => {
    const schema = /* GraphQL */ `
      type Post @model {
        id: String!
        title: String!
        content: String!
      }
    `;
    const ast = parse(schema);
    const builtSchema = buildSchemaWithDirectives(schema);
    const visitor = new AppSyncModelVisitor(builtSchema, { directives, target: 'android', generate: CodeGenGenerateEnum.code }, {});
    expect(() => visit(ast, { leave: visitor })).toThrowError();
  });

  describe('Connection', () => {
    const schema = /* GraphQL */ `
      type Post @model {
        title: String!
        content: String
        comments: [Comment] @connection
      }

      type Comment @model {
        comment: String!
        post: Post @connection
      }
    `;
    const ast = parse(schema);
    const builtSchema = buildSchemaWithDirectives(schema);
    const visitor = new AppSyncModelVisitor(builtSchema, { directives, target: 'android', generate: CodeGenGenerateEnum.code }, {});
    const commentsField = visitor.types.Post.fields.find(f => f.name === 'comments');
    console.log(commentsField);
  });
});
