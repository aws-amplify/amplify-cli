import { IndexTransformer, PrimaryKeyTransformer } from '@aws-amplify/graphql-index-transformer';
import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { GraphQLTransform, validateModelSchema } from '@aws-amplify/graphql-transformer-core';
import { Kind, parse } from 'graphql';
import { BelongsToTransformer, HasManyTransformer, HasOneTransformer } from '..';

test('fails if used as a has one relation', () => {
  const inputSchema = `
    type Test @model {
      id: ID!
      email: String!
      testObj: Test1 @hasMany
    }

    type Test1 @model {
      id: ID! @primaryKey
      name: String!
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer(), new HasManyTransformer()],
  });

  expect(() => transformer.transform(inputSchema)).toThrowError('@hasMany must be used with a list. Use @hasOne for non-list types.');
});

test('fails if the provided indexName does not exist.', () => {
  const inputSchema = `
    type Test @model {
      id: ID!
      email: String
      testObj: [Test1] @hasMany(indexName: "notDefault")
    }

    type Test1 @model {
      id: ID!
      friendID: ID!
      name: String!
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer(), new HasManyTransformer()],
  });

  expect(() => transformer.transform(inputSchema)).toThrowError('Index notDefault does not exist for model Test1');
});

test('fails if a partial sort key is provided', () => {
  const inputSchema = `
    type Test @model {
      id: ID!
      email: String!
      testObj: [Test1] @hasMany(indexName: "testIndex", fields: ["id", "email"])
    }

    type Test1 @model {
      id: ID! @index(name: "testIndex", sortKeyFields: ["friendID", "name"])
      friendID: ID!
      name: String!
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new IndexTransformer(), new HasManyTransformer()],
  });

  expect(() => transformer.transform(inputSchema)).toThrowError(
    'Invalid @hasMany directive on testObj. Partial sort keys are not accepted.',
  );
});

test('accepts @hasMany without a sort key', () => {
  const inputSchema = `
    type Test @model {
      id: ID!
      email: String!
      testObj: [Test1] @hasMany(indexName: "testIndex", fields: ["id"])
    }

    type Test1 @model {
      id: ID! @index(name: "testIndex", sortKeyFields: ["friendID", "name"])
      friendID: ID!
      name: String!
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new IndexTransformer(), new HasManyTransformer()],
  });

  expect(() => transformer.transform(inputSchema)).not.toThrowError();
});

test('fails if provided sort key type does not match custom index sort key type', () => {
  const inputSchema = `
    type Test @model {
        id: ID!
        email: String!
        testObj: [Test1] @hasMany(indexName: "testIndex", fields: ["id", "email"])
    }

    type Test1 @model {
      id: ID! @index(name: "testIndex", sortKeyFields: ["friendID"])
      friendID: ID!
      name: String!
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new IndexTransformer(), new HasManyTransformer()],
  });

  expect(() => transformer.transform(inputSchema)).toThrowError('email field is not of type ID');
});

test('fails if partition key type passed in does not match custom index partition key type', () => {
  const inputSchema = `
    type Test @model {
      id: ID!
      email: String!
      testObj: [Test1] @hasMany(indexName: "testIndex", fields: ["email", "id"])
    }

    type Test1 @model {
      id: ID! @index(name: "testIndex", sortKeyFields: ["friendID"])
      friendID: ID!
      name: String!
    }`;

  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new IndexTransformer(), new HasManyTransformer()],
  });

  expect(() => transformer.transform(inputSchema)).toThrowError('email field is not of type ID');
});

test('fails if @hasMany was used on an object that is not a model type', () => {
  const inputSchema = `
    type Test {
      id: ID!
      email: String!
      testObj: [Test1] @hasMany(fields: ["email"])
    }

    type Test1 @model {
      id: ID!
      name: String!
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new HasManyTransformer()],
  });

  expect(() => transformer.transform(inputSchema)).toThrowError(`@hasMany must be on an @model object type field.`);
});

test('fails if @hasMany was used with a related type that is not a model', () => {
  const inputSchema = `
    type Test @model {
      id: ID!
      email: String!
      testObj: [Test1] @hasMany(fields: "email")
    }

    type Test1 {
      id: ID!
      name: String!
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new HasManyTransformer()],
  });

  expect(() => transformer.transform(inputSchema)).toThrowError(`Object type Test1 must be annotated with @model.`);
});

test('fails if the related type does not exist', () => {
  const inputSchema = `
    type Test @model {
      id: ID!
      email: String!
      testObj: Test2 @hasMany(fields: ["email"])
    }

    type Test1 @model {
      id: ID!
      name: String!
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new HasManyTransformer()],
  });

  expect(() => transformer.transform(inputSchema)).toThrowError('Unknown type "Test2". Did you mean "Test" or "Test1"?');
});

test('fails if an empty list of fields is passed in', () => {
  const inputSchema = `
    type Test @model {
      id: ID!
      email: String
      testObj: [Test1] @hasMany(fields: [])
    }

    type Test1 @model {
      id: ID!
      name: String!
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new HasManyTransformer()],
  });

  expect(() => transformer.transform(inputSchema)).toThrowError('No fields passed to @hasMany directive.');
});

test('fails if any of the fields passed in are not in the parent model', () => {
  const inputSchema = `
    type Test @model {
      id: ID!
      email: String
      testObj: [Test1] @hasMany(fields: ["id", "name"])
    }

    type Test1 @model {
      id: ID! @primaryKey(sortKeyFields: ["name"])
      friendID: ID!
      name: String!
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer(), new HasManyTransformer()],
  });

  expect(() => transformer.transform(inputSchema)).toThrowError('name is not a field in Test');
});

test('has many query case', () => {
  const inputSchema = `
    type Test @model {
      id: ID!
      email: String!
      otherParts: [Test1] @hasMany(fields: ["id", "email"])
    }

    type Test1 @model {
      id: ID! @primaryKey(sortKeyFields: ["email"])
      friendID: ID!
      email: String!
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer(), new HasManyTransformer()],
  });

  const out = transformer.transform(inputSchema);
  expect(out).toBeDefined();
  const schema = parse(out.schema);
  validateModelSchema(schema);

  const testObjType = schema.definitions.find((def: any) => def.name && def.name.value === 'Test') as any;
  expect(testObjType).toBeDefined();

  const relatedField = testObjType.fields.find((f: any) => f.name.value === 'otherParts');
  expect(relatedField).toBeDefined();
  expect(relatedField.type.kind).toEqual(Kind.NAMED_TYPE);
  expect(relatedField.arguments.length).toEqual(4);
  expect(relatedField.arguments.find((f: any) => f.name.value === 'filter')).toBeDefined();
  expect(relatedField.arguments.find((f: any) => f.name.value === 'limit')).toBeDefined();
  expect(relatedField.arguments.find((f: any) => f.name.value === 'nextToken')).toBeDefined();
  expect(relatedField.arguments.find((f: any) => f.name.value === 'sortDirection')).toBeDefined();
  expect((relatedField.type as any).name.value).toEqual('ModelTest1Connection');
});

test('bidirectional has many query case', () => {
  const inputSchema = `
    type Post @model {
      id: ID!
      title: String!
      author: User @belongsTo(fields: ["owner"])
      owner: ID! @index(name: "byOwner", sortKeyFields: ["id"])
    }

    type User @model {
      id: ID!
      posts: [Post] @hasMany(indexName: "byOwner", fields: ["id"])
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new IndexTransformer(), new BelongsToTransformer(), new HasManyTransformer()],
  });

  const out = transformer.transform(inputSchema);
  expect(out).toBeDefined();
  const schema = parse(out.schema);
  validateModelSchema(schema);
  expect((out.stacks as any).User.Resources.PostauthorResolver).toBeTruthy();
  expect((out.stacks as any).Post.Resources.UserpostsResolver).toBeTruthy();

  const userType = schema.definitions.find((def: any) => def.name && def.name.value === 'User') as any;
  expect(userType).toBeDefined();

  const postsField = userType.fields.find((f: any) => f.name.value === 'posts');
  expect(postsField).toBeDefined();
  expect(postsField.type.kind).toEqual(Kind.NAMED_TYPE);
  expect(postsField.arguments.length).toEqual(5);
  expect(postsField.arguments.find((f: any) => f.name.value === 'id')).toBeDefined();
  expect(postsField.arguments.find((f: any) => f.name.value === 'filter')).toBeDefined();
  expect(postsField.arguments.find((f: any) => f.name.value === 'limit')).toBeDefined();
  expect(postsField.arguments.find((f: any) => f.name.value === 'nextToken')).toBeDefined();
  expect(postsField.arguments.find((f: any) => f.name.value === 'sortDirection')).toBeDefined();
  expect((postsField.type as any).name.value).toEqual('ModelPostConnection');

  const postType = schema.definitions.find((def: any) => def.name && def.name.value === 'Post') as any;
  expect(postType).toBeDefined();

  const userField = postType.fields.find((f: any) => f.name.value === 'author');
  expect(userField).toBeDefined();
  expect(userField.type.kind).toEqual(Kind.NAMED_TYPE);
});

test('has many query with a composite sort key', () => {
  const inputSchema = `
    type Test @model {
      id: ID!
      email: String!
      name: String!
      otherParts: [Test1] @hasMany(fields: ["id", "email", "name"])
    }

    type Test1 @model {
      id: ID! @primaryKey(sortKeyFields: ["email", "name"])
      friendID: ID!
      email: String!
      name: String!
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer(), new HasManyTransformer()],
  });

  const out = transformer.transform(inputSchema);
  expect(out).toBeDefined();
  const schema = parse(out.schema);
  validateModelSchema(schema);
  expect((out.stacks as any).Test1.Resources.TestotherPartsResolver).toBeTruthy();

  const testObjType = schema.definitions.find((def: any) => def.name && def.name.value === 'Test') as any;
  expect(testObjType).toBeDefined();

  const relatedField = testObjType.fields.find((f: any) => f.name.value === 'otherParts');
  expect(relatedField).toBeDefined();
  expect((relatedField.type as any).name.value).toEqual('ModelTest1Connection');
  expect(relatedField.type.kind).toEqual(Kind.NAMED_TYPE);
  expect(relatedField.arguments.length).toEqual(4);
  expect(relatedField.arguments.find((f: any) => f.name.value === 'filter')).toBeDefined();
  expect(relatedField.arguments.find((f: any) => f.name.value === 'limit')).toBeDefined();
  expect(relatedField.arguments.find((f: any) => f.name.value === 'nextToken')).toBeDefined();
  expect(relatedField.arguments.find((f: any) => f.name.value === 'sortDirection')).toBeDefined();
});

test('has many query with a composite sort key passed in as an argument', () => {
  const inputSchema = `
    type Test @model {
      id: ID!
      email: String!
      name: String!
      otherParts: [Test1] @hasMany(fields: ["id"])
    }

    type Test1 @model {
      id: ID! @primaryKey(sortKeyFields: ["email", "name"])
      friendID: ID!
      email: String!
      name: String!
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer(), new HasManyTransformer()],
  });

  const out = transformer.transform(inputSchema);
  expect(out).toBeDefined();
  const schema = parse(out.schema);
  validateModelSchema(schema);

  const testObjType = schema.definitions.find((def: any) => def.name && def.name.value === 'Test') as any;
  expect(testObjType).toBeDefined();

  const relatedField = testObjType.fields.find((f: any) => f.name.value === 'otherParts');
  expect(relatedField).toBeDefined();
  expect(relatedField.type.kind).toEqual(Kind.NAMED_TYPE);
  expect((relatedField.type as any).name.value).toEqual('ModelTest1Connection');
  expect(relatedField.arguments.length).toEqual(5);
  expect(relatedField.arguments.find((f: any) => f.name.value === 'emailName')).toBeDefined();
  expect(relatedField.arguments.find((f: any) => f.name.value === 'filter')).toBeDefined();
  expect(relatedField.arguments.find((f: any) => f.name.value === 'limit')).toBeDefined();
  expect(relatedField.arguments.find((f: any) => f.name.value === 'nextToken')).toBeDefined();
  expect(relatedField.arguments.find((f: any) => f.name.value === 'sortDirection')).toBeDefined();
});

test('many to many query', () => {
  const inputSchema = `
    type Post @model {
      id: ID!
      title: String!
      editors: [PostEditor] @hasMany(indexName: "byPost", fields: ["id"])
    }

    type PostEditor @model(queries: null) {
      id: ID!
      postID: ID! @index(name: "byPost", sortKeyFields: ["editorID"])
      editorID: ID! @index(name: "byEditor", sortKeyFields: ["postID"])
      post: Post! @hasOne(fields: ["postID"])
      editor: User! @hasOne(fields: ["editorID"])
    }

    type User @model {
      id: ID!
      username: String!
      posts: [PostEditor] @hasMany(indexName: "byEditor", fields: ["id"])
    }`;

  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new IndexTransformer(), new HasOneTransformer(), new HasManyTransformer()],
  });

  const out = transformer.transform(inputSchema);
  expect(out).toBeDefined();
  const schema = parse(out.schema);
  validateModelSchema(schema);
  expect(schema).toMatchSnapshot();
});

test('has many with implicit index and fields', () => {
  const inputSchema = `
    type Post @model {
      id: ID!
      title: String!
      comments: [Comment] @hasMany
    }
    type Comment @model {
      id: ID!
      content: String
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new HasManyTransformer()],
  });

  const out = transformer.transform(inputSchema);
  expect(out).toBeDefined();
  const schema = parse(out.schema);
  validateModelSchema(schema);

  const postType = schema.definitions.find((def: any) => def.name && def.name.value === 'Post') as any;
  expect(postType).toBeDefined();

  const commentField = postType.fields.find((f: any) => f.name.value === 'comments');
  expect(commentField).toBeDefined();
  expect(commentField.type.kind).toEqual(Kind.NAMED_TYPE);
  expect((commentField.type as any).name.value).toEqual('ModelCommentConnection');
  expect(commentField.arguments.length).toEqual(4);
  expect(commentField.arguments.find((f: any) => f.name.value === 'filter')).toBeDefined();
  expect(commentField.arguments.find((f: any) => f.name.value === 'limit')).toBeDefined();
  expect(commentField.arguments.find((f: any) => f.name.value === 'nextToken')).toBeDefined();
  expect(commentField.arguments.find((f: any) => f.name.value === 'sortDirection')).toBeDefined();

  const commentCreateInput = schema.definitions.find((def: any) => def.name && def.name.value === 'CreateCommentInput') as any;
  expect(commentCreateInput).toBeDefined();
  expect(commentCreateInput.fields.length).toEqual(3);
  expect(commentCreateInput.fields.find((f: any) => f.name.value === 'id')).toBeDefined();
  expect(commentCreateInput.fields.find((f: any) => f.name.value === 'content')).toBeDefined();
  expect(commentCreateInput.fields.find((f: any) => f.name.value === 'postCommentsId')).toBeDefined();

  const commentUpdateInput = schema.definitions.find((def: any) => def.name && def.name.value === 'UpdateCommentInput') as any;
  expect(commentUpdateInput).toBeDefined();
  expect(commentUpdateInput.fields.length).toEqual(3);
  expect(commentUpdateInput.fields.find((f: any) => f.name.value === 'id')).toBeDefined();
  expect(commentUpdateInput.fields.find((f: any) => f.name.value === 'content')).toBeDefined();
  expect(commentUpdateInput.fields.find((f: any) => f.name.value === 'postCommentsId')).toBeDefined();
});

test('has many with implicit index and fields and a user-defined primary key', () => {
  const inputSchema = `
    type Post @model {
      id: ID!
      title: String! @primaryKey
      comments: [Comment] @hasMany
    }
    type Comment @model {
      id: ID!
      content: String
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new PrimaryKeyTransformer(), new HasManyTransformer()],
  });

  const out = transformer.transform(inputSchema);
  expect(out).toBeDefined();
  const schema = parse(out.schema);
  validateModelSchema(schema);

  const postType = schema.definitions.find((def: any) => def.name && def.name.value === 'Post') as any;
  expect(postType).toBeDefined();

  const commentField = postType.fields.find((f: any) => f.name.value === 'comments');
  expect(commentField).toBeDefined();
  expect(commentField.type.kind).toEqual(Kind.NAMED_TYPE);
  expect((commentField.type as any).name.value).toEqual('ModelCommentConnection');
  expect(commentField.arguments.length).toEqual(4);
  expect(commentField.arguments.find((f: any) => f.name.value === 'filter')).toBeDefined();
  expect(commentField.arguments.find((f: any) => f.name.value === 'limit')).toBeDefined();
  expect(commentField.arguments.find((f: any) => f.name.value === 'nextToken')).toBeDefined();
  expect(commentField.arguments.find((f: any) => f.name.value === 'sortDirection')).toBeDefined();

  const commentCreateInput = schema.definitions.find((def: any) => def.name && def.name.value === 'CreateCommentInput') as any;
  expect(commentCreateInput).toBeDefined();
  expect(commentCreateInput.fields.length).toEqual(3);
  expect(commentCreateInput.fields.find((f: any) => f.name.value === 'id')).toBeDefined();
  expect(commentCreateInput.fields.find((f: any) => f.name.value === 'content')).toBeDefined();
  expect(commentCreateInput.fields.find((f: any) => f.name.value === 'postCommentsId')).toBeDefined();

  const commentUpdateInput = schema.definitions.find((def: any) => def.name && def.name.value === 'UpdateCommentInput') as any;
  expect(commentUpdateInput).toBeDefined();
  expect(commentUpdateInput.fields.length).toEqual(3);
  expect(commentUpdateInput.fields.find((f: any) => f.name.value === 'id')).toBeDefined();
  expect(commentUpdateInput.fields.find((f: any) => f.name.value === 'content')).toBeDefined();
  expect(commentUpdateInput.fields.find((f: any) => f.name.value === 'postCommentsId')).toBeDefined();
});

test('the limit of 100 is used by default', () => {
  const inputSchema = `
    type Post @model {
      id: ID!
      title: String!
      comments: [Comment] @hasMany
    }

    type Comment @model {
      id: ID!
      content: String
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new HasManyTransformer()],
  });

  const out = transformer.transform(inputSchema);
  expect(out).toBeDefined();
  const schema = parse(out.schema);
  validateModelSchema(schema);
  expect(out.pipelineFunctions['Post.comments.req.vtl']).toContain('#set( $limit = $util.defaultIfNull($context.args.limit, 100) )');
});

test('the default limit argument can be overridden', () => {
  const inputSchema = `
    type Post @model {
      id: ID!
      title: String!
      comments: [Comment] @hasMany(limit: 50)
    }

    type Comment @model {
      id: ID!
      content: String
    }`;
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new HasManyTransformer()],
  });

  const out = transformer.transform(inputSchema);
  expect(out).toBeDefined();
  const schema = parse(out.schema);
  validateModelSchema(schema);
  expect(out.pipelineFunctions['Post.comments.req.vtl']).toContain('#set( $limit = $util.defaultIfNull($context.args.limit, 50) )');
});

test('validates VTL of a complex schema', () => {
  const inputSchema = `
    type Child @model {
      id: ID! @primaryKey(sortKeyFields: ["name"])
      name: String!
      parents: [Parent] @hasMany(indexName: "byChild", fields: ["id"])
    }

    type Parent @model {
      id: ID!
      childID: ID! @index(name: "byChild", sortKeyFields: ["childName"])
      childName: String!
      child: Child @belongsTo(fields: ["childID", "childName"])
    }

    type User @model {
      id: ID! @primaryKey(sortKeyFields: ["name", "surname"])
      name: String!
      surname: String!
      friendships: [Friendship] @hasMany(indexName: "byUser", fields: ["id"])
    }

    type Friendship @model {
      id: ID!
      userID: ID! @index(name: "byUser", sortKeyFields: ["friendID"])
      friendID: ID!
      friend: [User] @hasMany(fields: ["friendID"])
    }

    type UserModel @model {
      id: ID! @primaryKey(sortKeyFields: ["rollNumber"]) @index(name: "composite", sortKeyFields: ["name", "surname"])
      rollNumber: Int!
      name: String!
      surname: String!
      authorPosts: [PostAuthor] @hasMany(indexName: "byAuthor", fields: ["id"])
    }

    type PostModel @model {
      id: ID!
      authorID: ID!
      authorName: String!
      authorSurname: String!
      postContents: [String]
      authors: [UserModel] @hasMany(indexName: "composite", fields: ["authorID", "authorName", "authorSurname"])
      singleAuthor: User @hasOne(fields: ["authorID", "authorName", "authorSurname"])
    }

    type Post @model {
      id: ID!
      authorID: ID!
      postContents: [String]
      authors: [User] @hasMany(fields: ["authorID"], limit: 50)
    }

    type PostAuthor @model {
        id: ID!
        authorID: ID! @index(name: "byAuthor", sortKeyFields: ["postID"])
        postID: ID!
        post: Post @hasOne(fields: ["postID"])
    }`;
  const transformer = new GraphQLTransform({
    transformers: [
      new ModelTransformer(),
      new PrimaryKeyTransformer(),
      new IndexTransformer(),
      new HasOneTransformer(),
      new HasManyTransformer(),
      new BelongsToTransformer(),
    ],
  });

  const out = transformer.transform(inputSchema);
  expect(out).toBeDefined();
  const schema = parse(out.schema);
  validateModelSchema(schema);
  expect(out.pipelineFunctions).toMatchSnapshot();
});
