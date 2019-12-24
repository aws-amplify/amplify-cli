import { buildSchema, parse, visit } from 'graphql';
import { directives } from '../../scalars/supported-directives';
import { CodeGenConnectionType, CodeGenFieldConnectionBelongsTo, CodeGenFieldConnectionHasMany } from '../../utils/process-connections';
import { AppSyncModelVisitor, CodeGenGenerateEnum } from '../../visitors/appsync-visitor';

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
  it('should have id as the first field to ensure arity of constructors', () => {
    const schema = /* GraphQL */ `
      type Post @model {
        title: String!
        content: String!
        id: ID!
      }
    `;
    const ast = parse(schema);
    const builtSchema = buildSchemaWithDirectives(schema);
    const visitor = new AppSyncModelVisitor(builtSchema, { directives, target: 'android', generate: CodeGenGenerateEnum.code }, {});
    visit(ast, { leave: visitor });
    const postFields = visitor.types.Post.fields;
    expect(postFields[0].name).toEqual('id');
    expect(postFields[0].type).toEqual('ID');
    expect(postFields[0].isNullable).toEqual(false);
    expect(postFields[0].isList).toEqual(false);
  });

  describe(' 2 Way Connection', () => {
    const schema = /* GraphQL */ `
      type Post @model {
        title: String!
        content: String
        comments: [Comment] @connection(name: "PostComment")
      }

      type Comment @model {
        comment: String!
        post: Post @connection(name: "PostComment")
      }
    `;
    it('one to many connection', () => {
      const ast = parse(schema);
      const builtSchema = buildSchemaWithDirectives(schema);
      const visitor = new AppSyncModelVisitor(builtSchema, { directives, target: 'android', generate: CodeGenGenerateEnum.code }, {});
      visit(ast, { leave: visitor });
      visitor.generate();
      const commentsField = visitor.types.Post.fields.find(f => f.name === 'comments');
      const postField = visitor.types.Comment.fields.find(f => f.name === 'post');
      expect(commentsField).toBeDefined();
      expect(commentsField!.connectionInfo).toBeDefined();
      const connectionInfo = (commentsField!.connectionInfo as any) as CodeGenFieldConnectionHasMany;
      expect(connectionInfo.kind).toEqual(CodeGenConnectionType.HAS_MANY);
      expect(connectionInfo.associatedWith).toEqual(postField);
      expect(connectionInfo.connectedModel).toEqual(visitor.types.Comment);
    });

    it('many to one connection', () => {
      const ast = parse(schema);
      const builtSchema = buildSchemaWithDirectives(schema);
      const visitor = new AppSyncModelVisitor(builtSchema, { directives, target: 'android', generate: CodeGenGenerateEnum.code }, {});
      visit(ast, { leave: visitor });
      visitor.generate();
      const commentsField = visitor.types.Post.fields.find(f => f.name === 'comments');
      const postField = visitor.types.Comment.fields.find(f => f.name === 'post');
      expect(postField).toBeDefined();
      expect(postField!.connectionInfo).toBeDefined();
      const connectionInfo = (postField!.connectionInfo as any) as CodeGenFieldConnectionBelongsTo;
      expect(connectionInfo.kind).toEqual(CodeGenConnectionType.BELONGS_TO);
      expect(connectionInfo.connectedModel).toEqual(visitor.types.Post);
    });
  });

  describe('one way connection', () => {
    it('should not include a comments in Post when comments field does not have connection directive', () => {
      const schema = /* GraphQL */ `
        type Post @model {
          title: String!
          content: String
          comments: [Comment]
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
      visitor.generate();
      const postFields = visitor.types.Post.fields.map(field => field.name);
      expect(postFields).not.toContain('comments');
    });

    it('should not include a post when post field in Comment when post does not have connection directive', () => {
      const schema = /* GraphQL */ `
        type Post @model {
          title: String!
          content: String
          comments: [Comment] @connection
        }

        type Comment @model {
          comment: String!
          post: Post
        }
      `;
      const ast = parse(schema);
      const builtSchema = buildSchemaWithDirectives(schema);
      const visitor = new AppSyncModelVisitor(builtSchema, { directives, target: 'android', generate: CodeGenGenerateEnum.code }, {});
      visit(ast, { leave: visitor });
      visitor.generate();
      const commentsField = visitor.types.Comment.fields.map(field => field.name);
      expect(commentsField).not.toContain('post');
      expect(commentsField).toContain('postCommentsId'); // because of connection from Post.comments
    });
  });
  describe('auth directive', () => {
    it('should process auth with owner authorization', () => {
      const schema = /* GraphQL */ `
        type Post @searchable @model @auth(rules: [{ allow: owner }]) {
          title: String!
          content: String
        }
      `;
      const ast = parse(schema);
      const builtSchema = buildSchemaWithDirectives(schema);
      const visitor = new AppSyncModelVisitor(builtSchema, { directives, target: 'android', generate: CodeGenGenerateEnum.code }, {});
      visit(ast, { leave: visitor });
      visitor.generate();
      const postModel = visitor.types.Post;
      const authDirective = postModel.directives.find(d => d.name === 'auth');
      expect(authDirective).toBeDefined();
      const authRules = authDirective!.arguments.rules;
      expect(authRules).toBeDefined();
      expect(authRules).toHaveLength(1);
      const ownerRule = authRules[0];
      expect(ownerRule).toBeDefined();

      expect(ownerRule.provider).toEqual('userPools');
      expect(ownerRule.identityClaim).toEqual('cognito:username');
      expect(ownerRule.ownerField).toEqual('owner');
      expect(ownerRule.operations).toEqual(['create', 'update', 'delete']);
    });

    it('should process group with owner authorization', () => {
      const schema = /* GraphQL */ `
        type Post @model @searchable @auth(rules: [{ allow: groups, groups: ["admin", "moderator"] }]) {
          title: String!
          content: String
        }
      `;
      const ast = parse(schema);
      const builtSchema = buildSchemaWithDirectives(schema);
      const visitor = new AppSyncModelVisitor(builtSchema, { directives, target: 'android', generate: CodeGenGenerateEnum.code }, {});
      visit(ast, { leave: visitor });
      visitor.generate();
      const postModel = visitor.types.Post;
      const authDirective = postModel.directives.find(d => d.name === 'auth');
      expect(authDirective).toBeDefined();
      const authRules = authDirective!.arguments.rules;
      expect(authRules).toBeDefined();
      expect(authRules).toHaveLength(1);
      const groupRule = authRules[0];
      expect(groupRule).toBeDefined();
      expect(groupRule.provider).toEqual('userPools');
      expect(groupRule.groupClaim).toEqual('cognito:groups');
      expect(groupRule.operations).toEqual(['create', 'update', 'delete']);
    });
  });
});
