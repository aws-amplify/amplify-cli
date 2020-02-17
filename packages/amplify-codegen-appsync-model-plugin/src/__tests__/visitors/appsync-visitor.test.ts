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
    expect(visitor.models.Post).toBeDefined();
    const postFields = visitor.models.Post.fields;
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
    expect(visitor.models.Post).toBeDefined();

    const postFields = visitor.models.Post.fields;
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
    const postFields = visitor.models.Post.fields;
    expect(postFields[0].name).toEqual('id');
    expect(postFields[0].type).toEqual('ID');
    expect(postFields[0].isNullable).toEqual(false);
    expect(postFields[0].isList).toEqual(false);
  });

  describe(' 2 Way Connection', () => {
    describe('with connection name', () => {
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
        const commentsField = visitor.models.Post.fields.find(f => f.name === 'comments');
        const postField = visitor.models.Comment.fields.find(f => f.name === 'post');
        expect(commentsField).toBeDefined();
        expect(commentsField!.connectionInfo).toBeDefined();
        const connectionInfo = (commentsField!.connectionInfo as any) as CodeGenFieldConnectionHasMany;
        expect(connectionInfo.kind).toEqual(CodeGenConnectionType.HAS_MANY);
        expect(connectionInfo.associatedWith).toEqual(postField);
        expect(connectionInfo.connectedModel).toEqual(visitor.models.Comment);
      });

      it('many to one connection', () => {
        const ast = parse(schema);
        const builtSchema = buildSchemaWithDirectives(schema);
        const visitor = new AppSyncModelVisitor(builtSchema, { directives, target: 'android', generate: CodeGenGenerateEnum.code }, {});
        visit(ast, { leave: visitor });
        visitor.generate();
        const commentsField = visitor.models.Post.fields.find(f => f.name === 'comments');
        const postField = visitor.models.Comment.fields.find(f => f.name === 'post');
        expect(postField).toBeDefined();
        expect(postField!.connectionInfo).toBeDefined();
        const connectionInfo = (postField!.connectionInfo as any) as CodeGenFieldConnectionBelongsTo;
        expect(connectionInfo.kind).toEqual(CodeGenConnectionType.BELONGS_TO);
        expect(connectionInfo.connectedModel).toEqual(visitor.models.Post);
      });
    });
    describe('connection with fields argument', () => {
      const schema = /* GraphQL */ `
        type Post @model {
          title: String!
          content: String
          comments: [Comment] @connection(fields: ["id"])
        }

        type Comment @model {
          comment: String!
          postId: ID!
          post: Post @connection(fields: ["postId"])
        }
      `;

      it('one to many connection', () => {
        const ast = parse(schema);
        const builtSchema = buildSchemaWithDirectives(schema);
        const visitor = new AppSyncModelVisitor(builtSchema, { directives, target: 'android', generate: CodeGenGenerateEnum.code }, {});
        visit(ast, { leave: visitor });
        visitor.generate();
        const commentsField = visitor.models.Post.fields.find(f => f.name === 'comments');
        const commentIdField = visitor.models.Post.fields.find(f => f.name === 'id');
        const postField = visitor.models.Comment.fields.find(f => f.name === 'post');
        expect(commentsField).toBeDefined();
        expect(commentsField!.connectionInfo).toBeDefined();
        const connectionInfo = (commentsField!.connectionInfo as any) as CodeGenFieldConnectionHasMany;
        expect(connectionInfo.kind).toEqual(CodeGenConnectionType.HAS_MANY);
        expect(connectionInfo.associatedWith).toEqual(commentIdField);
        expect(connectionInfo.connectedModel).toEqual(visitor.models.Comment);
      });

      it('many to one connection', () => {
        const ast = parse(schema);
        const builtSchema = buildSchemaWithDirectives(schema);
        const visitor = new AppSyncModelVisitor(builtSchema, { directives, target: 'android', generate: CodeGenGenerateEnum.code }, {});
        visit(ast, { leave: visitor });
        visitor.generate();

        const postField = visitor.models.Comment.fields.find(f => f.name === 'post');
        expect(postField).toBeDefined();
        expect(postField!.connectionInfo).toBeDefined();
        const connectionInfo = (postField!.connectionInfo as any) as CodeGenFieldConnectionBelongsTo;
        expect(connectionInfo.kind).toEqual(CodeGenConnectionType.BELONGS_TO);
        expect(connectionInfo.connectedModel).toEqual(visitor.models.Post);
      });
    });

    it('should support custom keys with key name (many to many)', () => {
      const schema = /* GraphQL */ `
        type Post @model {
          id: ID!
          title: String!
          editors: [PostEditor] @connection(keyName: "byPost", fields: ["id"])
        }

        # Create a join model and disable queries as you don't need them
        # and can query through Post.editors and User.posts
        type PostEditor
          @model(queries: null)
          @key(name: "byPost", fields: ["postID", "editorID"])
          @key(name: "byEditor", fields: ["editorID", "postID"]) {
          id: ID!
          postID: ID!
          editorID: ID!
          post: Post! @connection(fields: ["postID"])
          editor: User! @connection(fields: ["editorID"])
        }

        type User @model {
          id: ID!
          username: String!
          posts: [PostEditor] @connection(keyName: "byEditor", fields: ["id"])
        }
      `;
      const ast = parse(schema);
      const builtSchema = buildSchemaWithDirectives(schema);

      const visitor = new AppSyncModelVisitor(builtSchema, { directives, target: 'android', generate: CodeGenGenerateEnum.code }, {});
      visit(ast, { leave: visitor });
      visitor.generate();
      const postModel = visitor.models.Post;
      const userModel = visitor.models.User;
      const editorModel = visitor.models.PostEditor;

      const postEditorsField = postModel.fields.find(field => field.name === 'editors');
      const editorPostPostField = editorModel.fields.find(field => field.name === 'post');
      const editorEditorField = editorModel.fields.find(field => field.name === 'editor');
      const userPostsField = userModel.fields.find(field => field.name === 'posts');

      expect(postEditorsField.connectionInfo).toBeDefined();
      expect(postEditorsField.connectionInfo!.connectedModel).toEqual(editorModel);
      expect(postEditorsField.connectionInfo!.kind).toEqual(CodeGenConnectionType.HAS_MANY);
      const postEditorConnection = postEditorsField.connectionInfo as CodeGenFieldConnectionHasMany;
      expect(postEditorConnection.associatedWith).toEqual(editorPostPostField);

      expect(userPostsField.connectionInfo).toBeDefined();
      expect(userPostsField.connectionInfo!.connectedModel).toEqual(editorModel);
      expect(userPostsField.connectionInfo!.kind).toEqual(CodeGenConnectionType.HAS_MANY);
      const userPostsConnection = userPostsField.connectionInfo as CodeGenFieldConnectionHasMany;
      expect(userPostsConnection.associatedWith).toEqual(editorEditorField);

      expect(editorEditorField.connectionInfo).toBeDefined();
      expect(editorEditorField.connectionInfo!.kind).toEqual(CodeGenConnectionType.BELONGS_TO);
      const editorEditorConnection = editorEditorField.connectionInfo as CodeGenFieldConnectionBelongsTo;
      expect(editorEditorConnection.targetName).toEqual('editorID');

      expect(editorPostPostField.connectionInfo).toBeDefined();
      expect(editorPostPostField.connectionInfo!.kind).toEqual(CodeGenConnectionType.BELONGS_TO);
      const editorPostConnection = editorPostPostField.connectionInfo as CodeGenFieldConnectionBelongsTo;
      expect(editorPostConnection.targetName).toEqual('postID');
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
      const postFields = visitor.models.Post.fields.map(field => field.name);
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
      const commentsField = visitor.models.Comment.fields.map(field => field.name);
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
      const postModel = visitor.models.Post;
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
      const postModel = visitor.models.Post;
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
  describe('model less type', () => {
    let visitor;
    beforeEach(() => {
      const schema = /* GraphQL */ `
        type Metadata {
          authorName: String!
          tags: [String]
          rating: Int!
        }
      `;
      const ast = parse(schema);
      const builtSchema = buildSchemaWithDirectives(schema);
      visitor = new AppSyncModelVisitor(builtSchema, { directives, target: 'android', generate: CodeGenGenerateEnum.code }, {});
      visit(ast, { leave: visitor });
      visitor.generate();
    });

    it('should support types without model', () => {
      const metaDataType = visitor.nonModels.Metadata;

      expect(metaDataType).toBeDefined();
      const metaDataFields = metaDataType.fields;

      expect(metaDataFields[0].name).toEqual('authorName');
      expect(metaDataFields[0].type).toEqual('String');
      expect(metaDataFields[0].isNullable).toEqual(false);
      expect(metaDataFields[0].isList).toEqual(false);

      expect(metaDataFields[1].name).toEqual('tags');
      expect(metaDataFields[1].type).toEqual('String');
      expect(metaDataFields[1].isNullable).toEqual(true);
      expect(metaDataFields[1].isList).toEqual(true);

      expect(metaDataFields[2].name).toEqual('rating');
      expect(metaDataFields[2].type).toEqual('Int');
      expect(metaDataFields[2].isNullable).toEqual(false);
      expect(metaDataFields[2].isList).toEqual(false);
    });
  });
});
