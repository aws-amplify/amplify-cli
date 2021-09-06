import {
  ObjectTypeDefinitionNode,
  parse,
  FieldDefinitionNode,
  DocumentNode,
  DefinitionNode,
  Kind,
  InputObjectTypeDefinitionNode,
  InputValueDefinitionNode,
} from 'graphql';
import { GraphQLTransform, TRANSFORM_CURRENT_VERSION } from 'graphql-transformer-core';
import { ResolverResourceIDs, ModelResourceIDs, ResourceConstants } from 'graphql-transformer-common';
import { DynamoDBRelayModelTransformer } from '../model/DynamoDBRelayModelTransformer';
import { ModelRelayConnectionTransformer } from '../connection/ModelRelayConnectionTransformer';
const featureFlags = {
  getBoolean: jest.fn().mockImplementation((name, defaultValue) => {
    if (name === 'improvePluralization') {
      return true;
    }
    return;
  }),
  getNumber: jest.fn(),
  getObject: jest.fn(),
  getString: jest.fn(),
};

test('Test ModelRelayConnectionTransformer simple one to many happy case', () => {
  const validSchema = `
    type Post @relayModel {
        id: ID!
        title: String!
        comments: [Comment] @relayConnection
    }
    type Comment @relayModel {
        id: ID!
        content: String
    }
    `;
  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBRelayModelTransformer(), new ModelRelayConnectionTransformer()],
    featureFlags,
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.stacks.RelayConnectionStack.Resources[ResolverResourceIDs.ResolverResourceID('Post', 'comments')]).toBeTruthy();
  const schemaDoc = parse(out.schema);

  // Post.comments field
  const postType = getObjectType(schemaDoc, 'Post');
  expectFields(postType, ['comments']);
  const commentField = postType.fields.find(f => f.name.value === 'comments');
  expect(commentField.arguments.length).toEqual(4);
  expectArguments(commentField, ['filter', 'first', 'after', 'sortDirection']);
  expect(commentField.type.kind).toEqual(Kind.NAMED_TYPE);
  expect((commentField.type as any).name.value).toEqual('ModelCommentConnection');

  // Check the Comment.commentPostId
  // Check the Comment.commentPostId inputs
  const commentCreateInput = getInputType(schemaDoc, ModelResourceIDs.ModelCreateInputObjectName('Comment'));
  const connectionId = commentCreateInput.fields.find(f => f.name.value === 'postCommentsId');
  expect(connectionId).toBeTruthy();

  const commentUpdateInput = getInputType(schemaDoc, ModelResourceIDs.ModelUpdateInputObjectName('Comment'));
  const connectionUpdateId = commentUpdateInput.fields.find(f => f.name.value === 'postCommentsId');
  expect(connectionUpdateId).toBeTruthy();
});

test('Test ModelRelayConnectionTransformer simple one to many happy case with custom keyField', () => {
  const validSchema = `
    type Post @relayModel {
        id: ID!
        title: String!
        comments: [Comment] @relayConnection(keyField: "postId")
    }
    type Comment @relayModel {
        id: ID!
        content: String
    }
    `;
  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBRelayModelTransformer(), new ModelRelayConnectionTransformer()],
    featureFlags,
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.stacks.RelayConnectionStack.Resources[ResolverResourceIDs.ResolverResourceID('Post', 'comments')]).toBeTruthy();
  const schemaDoc = parse(out.schema);

  // Post.comments field
  const postType = getObjectType(schemaDoc, 'Post');
  expectFields(postType, ['comments']);
  const commentField = postType.fields.find(f => f.name.value === 'comments');
  expect(commentField.arguments.length).toEqual(4);
  expectArguments(commentField, ['filter', 'first', 'after', 'sortDirection']);
  expect(commentField.type.kind).toEqual(Kind.NAMED_TYPE);
  expect((commentField.type as any).name.value).toEqual('ModelCommentConnection');

  // Check the Comment.commentPostId
  // Check the Comment.commentPostId inputs
  const commentCreateInput = getInputType(schemaDoc, ModelResourceIDs.ModelCreateInputObjectName('Comment'));
  const connectionId = commentCreateInput.fields.find(f => f.name.value === 'postId');
  expect(connectionId).toBeTruthy();

  const commentUpdateInput = getInputType(schemaDoc, ModelResourceIDs.ModelUpdateInputObjectName('Comment'));
  const connectionUpdateId = commentUpdateInput.fields.find(f => f.name.value === 'postId');
  expect(connectionUpdateId).toBeTruthy();
});

test('Test that ModelRelayConnection Transformer throws error when the field in connection is not found in the related Type', () => {
  const invalidSchema = `
  type Post @relayModel {
    name: String!
    teamID: ID!
    team: Team @relayConnection(fields: ["teamID"])
  }

  type Team @relayModel {
    name: [String!]!
  }
  `;
  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBRelayModelTransformer(), new ModelRelayConnectionTransformer()],
    featureFlags,
  });

  try {
    transformer.transform(invalidSchema);
    expect(true).toEqual(false);
  } catch (e) {
    console.log(e);
    expect(e).toBeTruthy();
    expect(e.name).toEqual('InvalidDirectiveError');
  }
});

test('Test ModelRelayConnectionTransformer simple one to many happy case with custom keyField', () => {
  const validSchema = `
    type Post @relayModel {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
        comments: [Comment] @relayConnection(name: "PostComments", keyField: "postId")
    }
    type Comment @relayModel {
        id: ID!
        content: String!
        post: Post! @relayConnection(name: "PostComments", keyField: "postId")
    }
    `;
  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBRelayModelTransformer(), new ModelRelayConnectionTransformer()],
    featureFlags,
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.stacks.RelayConnectionStack.Resources[ResolverResourceIDs.ResolverResourceID('Post', 'comments')]).toBeTruthy();
  const schemaDoc = parse(out.schema);

  // Post.comments field
  const postType = getObjectType(schemaDoc, 'Post');
  expectFields(postType, ['comments']);
  const commentField = postType.fields.find(f => f.name.value === 'comments');
  expect(commentField.arguments.length).toEqual(4);
  expectArguments(commentField, ['filter', 'first', 'after', 'sortDirection']);
  expect(commentField.type.kind).toEqual(Kind.NAMED_TYPE);
  expect((commentField.type as any).name.value).toEqual('ModelCommentConnection');

  // Check the Comment.commentPostId
  // Check the Comment.commentPostId inputs
  const commentCreateInput = getInputType(schemaDoc, ModelResourceIDs.ModelCreateInputObjectName('Comment'));
  const connectionId = commentCreateInput.fields.find(f => f.name.value === 'postId');
  expect(connectionId).toBeTruthy();
  expect(connectionId.type.kind).toEqual(Kind.NON_NULL_TYPE);

  const commentUpdateInput = getInputType(schemaDoc, ModelResourceIDs.ModelUpdateInputObjectName('Comment'));
  const connectionUpdateId = commentUpdateInput.fields.find(f => f.name.value === 'postId');
  expect(connectionUpdateId).toBeTruthy();
  expect(connectionUpdateId.type.kind).toEqual(Kind.NAMED_TYPE);
});

test('Test ModelRelayConnectionTransformer complex one to many happy case', () => {
  const validSchema = `
    type Post @relayModel {
        id: ID!
        title: String!
        comments: [Comment] @relayConnection(name: "PostComments")
    }
    type Comment @relayModel {
        id: ID!
        content: String
        post: Post @relayConnection(name: "PostComments")
    }
    `;
  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBRelayModelTransformer(), new ModelRelayConnectionTransformer()],
    featureFlags,
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.stacks.RelayConnectionStack.Resources[ResolverResourceIDs.ResolverResourceID('Post', 'comments')]).toBeTruthy();
  expect(out.stacks.RelayConnectionStack.Resources[ResolverResourceIDs.ResolverResourceID('Comment', 'post')]).toBeTruthy();
  const schemaDoc = parse(out.schema);
  const postType = getObjectType(schemaDoc, 'Post');
  const commentType = getObjectType(schemaDoc, 'Comment');

  // Check Post.comments field
  expectFields(postType, ['comments']);
  const commentField = postType.fields.find(f => f.name.value === 'comments');
  expect(commentField.arguments.length).toEqual(4);
  expectArguments(commentField, ['filter', 'first', 'after', 'sortDirection']);
  expect(commentField.type.kind).toEqual(Kind.NAMED_TYPE);
  expect((commentField.type as any).name.value).toEqual('ModelCommentConnection');

  // Check the Comment.commentPostId inputs
  const commentCreateInput = getInputType(schemaDoc, ModelResourceIDs.ModelCreateInputObjectName('Comment'));
  const connectionId = commentCreateInput.fields.find(f => f.name.value === 'commentPostId');
  expect(connectionId).toBeTruthy();

  const commentUpdateInput = getInputType(schemaDoc, ModelResourceIDs.ModelUpdateInputObjectName('Comment'));
  const connectionUpdateId = commentUpdateInput.fields.find(f => f.name.value === 'commentPostId');
  expect(connectionUpdateId).toBeTruthy();

  // Check Comment.post field
  const postField = commentType.fields.find(f => f.name.value === 'post');
  expect(postField.arguments.length).toEqual(0);
  expect(postField.type.kind).toEqual(Kind.NAMED_TYPE);
  expect((postField.type as any).name.value).toEqual('Post');
});

test('Test ModelRelayConnectionTransformer many to many should fail', () => {
  const validSchema = `
    type Post @relayModel {
        id: ID!
        title: String!
        comments: [Comment] @relayConnection(name: "ManyToMany")
    }
    type Comment @relayModel {
        id: ID!
        content: String
        posts: [Post] @relayConnection(name: "ManyToMany")
    }
    `;
  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBRelayModelTransformer(), new ModelRelayConnectionTransformer()],
    featureFlags,
  });
  try {
    transformer.transform(validSchema);
    expect(true).toEqual(false);
  } catch (e) {
    // Should throw bc we don't let support many to many
    expect(e).toBeTruthy();
    expect(e.name).toEqual('InvalidDirectiveError');
  }
});

test('Test ModelRelayConnectionTransformer many to many should fail due to missing other "name"', () => {
  const validSchema = `
    type Post @relayModel {
        id: ID!
        title: String!
        comments: [Comment] @relayConnection(name: "ManyToMany")
    }
    type Comment @relayModel {
        id: ID!
        content: String

        # This is meant to be the other half of "ManyToMany" but I forgot.
        posts: [Post] @relayConnection
    }
    `;
  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBRelayModelTransformer(), new ModelRelayConnectionTransformer()],
    featureFlags,
  });
  try {
    transformer.transform(validSchema);
    expect(true).toEqual(false);
  } catch (e) {
    // Should throw bc we check both halves when name is given
    expect(e).toBeTruthy();
    expect(e.name).toEqual('InvalidDirectiveError');
  }
});

test('Test ModelRelayConnectionTransformer many to many should fail due to missing other "name"', () => {
  const validSchema = `
    type Post @relayModel {
        id: ID!
        things: [Thing!] @relayConnection
    }

    type Thing @relayModel(queries: null, mutations: null) {
        id: ID!
    }
    `;
  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBRelayModelTransformer(), new ModelRelayConnectionTransformer()],
    featureFlags,
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.stacks.RelayConnectionStack.Resources[ResolverResourceIDs.ResolverResourceID('Post', 'things')]).toBeTruthy();
  const schemaDoc = parse(out.schema);
  const postType = getObjectType(schemaDoc, 'Post');
  const postConnection = getObjectType(schemaDoc, 'ModelPostConnection');
  const thingConnection = getObjectType(schemaDoc, 'ModelThingConnection');
  const thingEdge = getObjectType(schemaDoc, 'ModelThingEdge');
  const thingFilterInput = getInputType(schemaDoc, 'ModelThingFilterInput');
  expect(thingFilterInput).toBeDefined();
  expect(postType).toBeDefined();
  expect(thingConnection).toBeDefined();
  expect(thingEdge).toBeDefined();
  expect(postConnection).toBeDefined();
});

test('Test ModelRelayConnectionTransformer with non null @relayConnections', () => {
  const validSchema = `
    type Post @relayModel {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
        comments: [Comment] @relayConnection(name: "PostComments", keyField: "postId")

        # A non null on the one in a 1-M does enforce a non-null
        # on the CreatePostInput
        singleComment: Comment! @relayConnection

        # A non null on the many in a 1-M does not enforce a non-null
        # in the CommentCreateInput because it is not explicitly implied.
        manyComments: [Comment]! @relayConnection
    }
    type Comment @relayModel {
        id: ID!
        content: String!

        # A non-null on the one in 1-M again enforces a non null.
        post: Post! @relayConnection(name: "PostComments", keyField: "postId")
    }
    `;
  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBRelayModelTransformer(), new ModelRelayConnectionTransformer()],
    featureFlags,
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.stacks.RelayConnectionStack.Resources[ResolverResourceIDs.ResolverResourceID('Post', 'comments')]).toBeTruthy();
  const schemaDoc = parse(out.schema);

  // Post.comments field
  const postType = getObjectType(schemaDoc, 'Post');
  expectFields(postType, ['comments']);
  const commentField = postType.fields.find(f => f.name.value === 'comments');
  expect(commentField.arguments.length).toEqual(4);
  expectArguments(commentField, ['filter', 'first', 'after', 'sortDirection']);
  expect(commentField.type.kind).toEqual(Kind.NAMED_TYPE);
  expect((commentField.type as any).name.value).toEqual('ModelCommentConnection');

  // Check the Comment.commentPostId
  // Check the Comment.commentPostId inputs
  const commentCreateInput = getInputType(schemaDoc, ModelResourceIDs.ModelCreateInputObjectName('Comment'));
  const connectionId = commentCreateInput.fields.find(f => f.name.value === 'postId');
  expect(connectionId).toBeTruthy();
  expect(connectionId.type.kind).toEqual(Kind.NON_NULL_TYPE);

  const manyCommentId = commentCreateInput.fields.find(f => f.name.value === 'postManyCommentsId');
  expect(manyCommentId).toBeTruthy();
  expect(manyCommentId.type.kind).toEqual(Kind.NAMED_TYPE);

  const commentUpdateInput = getInputType(schemaDoc, ModelResourceIDs.ModelUpdateInputObjectName('Comment'));
  const connectionUpdateId = commentUpdateInput.fields.find(f => f.name.value === 'postId');
  expect(connectionUpdateId).toBeTruthy();
  expect(connectionUpdateId.type.kind).toEqual(Kind.NAMED_TYPE);

  // Check the post create type
  const postCreateInput = getInputType(schemaDoc, ModelResourceIDs.ModelCreateInputObjectName('Post'));
  const postConnectionId = postCreateInput.fields.find(f => f.name.value === 'postSingleCommentId');
  expect(postConnectionId).toBeTruthy();
  expect(postConnectionId.type.kind).toEqual(Kind.NON_NULL_TYPE);
});

test('Test ModelRelayConnectionTransformer with sortField fails if not specified in associated type', () => {
  const validSchema = `
    type Post @relayModel {
        id: ID!
        title: String!
        comments: [Comment] @relayConnection(name: "PostComments", sortField: "createdAt")
    }
    type Comment @relayModel {
        id: ID!
        content: String
        post: Post @relayConnection(name: "PostComments")
    }
    `;
  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBRelayModelTransformer(), new ModelRelayConnectionTransformer()],
    featureFlags,
  });
  expect(() => {
    transformer.transform(validSchema);
  }).toThrowError();
});

test('Test ModelRelayConnectionTransformer with sortField creates a connection resolver with a sort key condition.', () => {
  const validSchema = `
    type Post @relayModel {
        id: ID!
        title: String!
        comments: [Comment] @relayConnection(name: "PostComments", sortField: "createdAt")
    }
    type Comment @relayModel {
        id: ID!
        content: String
        post: Post @relayConnection(name: "PostComments", sortField: "createdAt")
        createdAt: AWSDateTime
    }
    `;
  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBRelayModelTransformer(), new ModelRelayConnectionTransformer()],
    featureFlags,
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.stacks.RelayConnectionStack.Resources[ResolverResourceIDs.ResolverResourceID('Post', 'comments')]).toBeTruthy();
  const schemaDoc = parse(out.schema);

  // Post.comments field
  const postType = getObjectType(schemaDoc, 'Post');
  expectFields(postType, ['comments']);
  const commentField = postType.fields.find(f => f.name.value === 'comments');
  expect(commentField.arguments.length).toEqual(5);
  expectArguments(commentField, ['createdAt', 'filter', 'first', 'after', 'sortDirection']);
});

test('Test ModelRelayConnectionTransformer throws with invalid key fields', () => {
  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBRelayModelTransformer(), new ModelRelayConnectionTransformer()],
    featureFlags,
  });

  const invalidSchema = `
    type Post @relayModel {
        id: ID!
        title: String!
        comments: [Comment] @relayConnection(keyField: "postId")
    }
    type Comment @relayModel {
        id: ID!
        content: String

        # Key fields must be String or ID.
        postId: [String]
    }
    `;
  expect(() => transformer.transform(invalidSchema)).toThrow();

  const invalidSchema2 = `
    type Post @relayModel {
        id: ID!
        title: String!
        comments: [Comment] @relayConnection(name: "PostComments", keyField: "postId")
    }
    type Comment @relayModel {
        id: ID!
        content: String

        # Key fields must be String or ID.
        postId: [String]

        post: Post @relayConnection(name: "PostComments", keyField: "postId")
    }
    `;
  expect(() => transformer.transform(invalidSchema2)).toThrow();

  const invalidSchema3 = `
    type Post @relayModel {
        id: ID!
        title: String!
    }
    type Comment @relayModel {
        id: ID!
        content: String

        # Key fields must be String or ID.
        postId: [String]

        post: Post @relayConnection(keyField: "postId")
    }
    `;
  expect(() => transformer.transform(invalidSchema3)).toThrow();
});

test('Test ModelRelayConnectionTransformer does not throw with valid key fields', () => {
  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBRelayModelTransformer(), new ModelRelayConnectionTransformer()],
    featureFlags,
  });

  const validSchema = `
    type Post @relayModel {
        id: ID!
        title: String!
        comments: [Comment] @relayConnection(keyField: "postId")
    }
    type Comment @relayModel {
        id: ID!
        content: String

        # Key fields must be String or ID.
        postId: String
    }
    `;
  expect(() => transformer.transform(validSchema)).toBeTruthy();

  const validSchema2 = `
    type Post @relayModel {
        id: ID!
        title: String!
        comments: [Comment] @relayConnection(name: "PostComments", keyField: "postId")
    }
    type Comment @relayModel {
        id: ID!
        content: String

        # Key fields must be String or ID.
        postId: ID

        post: Post @relayConnection(name: "PostComments", keyField: "postId")
    }
    `;
  expect(() => transformer.transform(validSchema2)).toBeTruthy();

  const validSchema3 = `
    type Post @relayModel {
        id: ID!
        title: String!
    }
    type Comment @relayModel {
        id: ID!
        content: String

        # Key fields must be String or ID.
        postId: String

        post: Post @relayConnection(keyField: "postId")
    }
    `;
  expect(() => transformer.transform(validSchema3)).toBeTruthy();
});

test('Test ModelRelayConnectionTransformer sortField with missing @key should fail', () => {
  const validSchema = `
    type Model1 @relayModel(subscriptions: null)
    {
        id: ID!
        sort: Int!
        name: String!
    }
    type Model2 @relayModel(subscriptions: null)
    {
        id: ID!
        connection: Model1 @relayConnection(sortField: "modelOneSort")
        modelOneSort: Int!
    }
        `;

  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBRelayModelTransformer(), new ModelRelayConnectionTransformer()],
    featureFlags,
  });

  try {
    transformer.transform(validSchema);
    expect(true).toEqual(false);
  } catch (e) {
    expect(e).toBeTruthy();
    expect(e.name).toEqual('InvalidDirectiveError');
  }
});

test('Test ModelRelayConnectionTransformer overrides the default limit', () => {
  const validSchema = `
    type Post @relayModel {
        id: ID!
        title: String!
        comments: [Comment] @relayConnection(limit: 50)
    }
    type Comment @relayModel {
        id: ID!
        content: String
    }
    `;

  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBRelayModelTransformer(), new ModelRelayConnectionTransformer()],
    featureFlags,
  });

  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.stacks.RelayConnectionStack.Resources[ResolverResourceIDs.ResolverResourceID('Post', 'comments')]).toBeTruthy();

  // Post.comments field
  expect(out.resolvers['Post.comments.req.vtl']).toContain('#set( $limit = $util.defaultIfNull($context.args.limit, 50) )');
});

test('Test ModelRelayConnectionTransformer uses the default limit', () => {
  const validSchema = `
    type Post @relayModel {
        id: ID!
        title: String!
        comments: [Comment] @relayConnection
    }
    type Comment @relayModel {
        id: ID!
        content: String
    }
    `;
  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBRelayModelTransformer(), new ModelRelayConnectionTransformer()],
    featureFlags,
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.stacks.RelayConnectionStack.Resources[ResolverResourceIDs.ResolverResourceID('Post', 'comments')]).toBeTruthy();

  // Post.comments field
  expect(out.resolvers['Post.comments.req.vtl']).toContain(
    `#set( $limit = $util.defaultIfNull($context.args.limit, ${ResourceConstants.DEFAULT_PAGE_LIMIT}) )`,
  );
});

test('Test ModelRelayConnectionTransformer with keyField overrides the default limit', () => {
  const validSchema = `
    type Post @relayModel {
        id: ID!
        title: String!
        comments: [Comment] @relayConnection(limit: 50, fields: ["id"])
    }
    type Comment @relayModel {
        id: ID!
        content: String
    }
    `;

  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBRelayModelTransformer(), new ModelRelayConnectionTransformer()],
    featureFlags,
  });

  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.stacks.RelayConnectionStack.Resources[ResolverResourceIDs.ResolverResourceID('Post', 'comments')]).toBeTruthy();

  // Post.comments field
  expect(out.resolvers['Post.comments.req.vtl']).toContain('#set( $limit = $util.defaultIfNull($context.args.limit, 50) )');
});

test('Test ModelRelayConnectionTransformer with keyField uses the default limit', () => {
  const validSchema = `
    type Post @relayModel {
        id: ID!
        title: String!
        comments: [Comment] @relayConnection(fields: ["id"])
    }
    type Comment @relayModel {
        id: ID!
        content: String
    }
    `;
  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBRelayModelTransformer(), new ModelRelayConnectionTransformer()],
    featureFlags,
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.stacks.RelayConnectionStack.Resources[ResolverResourceIDs.ResolverResourceID('Post', 'comments')]).toBeTruthy();

  // Post.comments field
  expect(out.resolvers['Post.comments.req.vtl']).toContain(
    `#set( $limit = $util.defaultIfNull($context.args.limit, ${ResourceConstants.DEFAULT_PAGE_LIMIT}) )`,
  );
});

test('Connection on models with no codegen includes AttributeTypeEnum', () => {
  const validSchema = `
    type Post @relayModel(queries: null, mutations: null, subscriptions: null) {
        id: ID!
        title: String!
        comments: [Comment] @relayConnection
    }
    type Comment @relayModel(queries: null, mutations: null, subscriptions: null) {
        id: ID!
        content: String
    }
  `;

  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBRelayModelTransformer(), new ModelRelayConnectionTransformer()],
    featureFlags,
    transformConfig: {
      Version: TRANSFORM_CURRENT_VERSION,
    },
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();

  expect(out.schema).toMatchSnapshot();
});

test('Connection on models with no codegen includes custom enum filters', () => {
  const validSchema = `
    type Cart @relayModel(queries: null, mutations: null, subscriptions: null) {
      id: ID!,
      cartItems: [CartItem] @relayConnection(name: "CartCartItem")
    }

    type CartItem @relayModel(queries: null, mutations: null, subscriptions: null) {
      id: ID!
      productType: PRODUCT_TYPE!
      cart: Cart @relayConnection(name: "CartCartItem")
    }

    enum PRODUCT_TYPE {
      UNIT
      PACKAGE
    }
  `;

  const transformer = new GraphQLTransform({
    transformers: [new DynamoDBRelayModelTransformer(), new ModelRelayConnectionTransformer()],
    featureFlags,
    transformConfig: {
      Version: TRANSFORM_CURRENT_VERSION,
    },
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.schema).toMatchSnapshot();
});

function expectFields(type: ObjectTypeDefinitionNode, fields: string[]) {
  for (const fieldName of fields) {
    const foundField = type.fields.find((f: FieldDefinitionNode) => f.name.value === fieldName);
    expect(foundField).toBeDefined();
  }
}

function expectArguments(field: FieldDefinitionNode, args: string[]) {
  for (const argName of args) {
    const foundArg = field.arguments.find((a: InputValueDefinitionNode) => a.name.value === argName);
    expect(foundArg).toBeDefined();
  }
}

function doNotExpectFields(type: ObjectTypeDefinitionNode, fields: string[]) {
  for (const fieldName of fields) {
    expect(type.fields.find((f: FieldDefinitionNode) => f.name.value === fieldName)).toBeUndefined();
  }
}

function getObjectType(doc: DocumentNode, type: string): ObjectTypeDefinitionNode | undefined {
  return doc.definitions.find((def: DefinitionNode) => def.kind === Kind.OBJECT_TYPE_DEFINITION && def.name.value === type) as
    | ObjectTypeDefinitionNode
    | undefined;
}

function getInputType(doc: DocumentNode, type: string): InputObjectTypeDefinitionNode | undefined {
  return doc.definitions.find((def: DefinitionNode) => def.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION && def.name.value === type) as
    | InputObjectTypeDefinitionNode
    | undefined;
}

function verifyInputCount(doc: DocumentNode, type: string, count: number): boolean {
  return doc.definitions.filter(def => def.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION && def.name.value === type).length === count;
}
