import { AuthTransformer } from '@aws-amplify/graphql-auth-transformer';
import { IndexTransformer } from '@aws-amplify/graphql-index-transformer';
import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { GraphQLTransform } from '@aws-amplify/graphql-transformer-core';
import { AppSyncAuthConfiguration, AppSyncAuthMode } from '@aws-amplify/graphql-transformer-interfaces';
import { DocumentNode, ObjectTypeDefinitionNode, Kind, FieldDefinitionNode, parse, InputValueDefinitionNode } from 'graphql';
import { HasManyTransformer, BelongsToTransformer } from '..';

const iamDefaultConfig: AppSyncAuthConfiguration = {
  defaultAuthentication: {
    authenticationType: 'AWS_IAM',
  },
  additionalAuthenticationProviders: [],
};

const apiKeyDefaultConfig: AppSyncAuthConfiguration = {
  defaultAuthentication: {
    authenticationType: 'API_KEY',
  },
  additionalAuthenticationProviders: [],
};

test('per-field auth on relational field', () => {
  const validSchema = `
  type Post @model @auth(rules: [ { allow: groups, groups: ["admin"] }, { allow: groups, groups: ["viewer"], operations: [read] } ]){
    id: ID!
    title: String!
    comments: [Comment] @hasMany @auth(rules: [ { allow: groups, groups: ["admin"] } ])
  }

  type Comment @model {
    id: ID!
    content: String
  }`;
  const authConfig: AppSyncAuthConfiguration = {
    defaultAuthentication: {
      authenticationType: 'AMAZON_COGNITO_USER_POOLS',
    },
    additionalAuthenticationProviders: [{ authenticationType: 'AWS_IAM' }],
  };
  const transformer = new GraphQLTransform({
    authConfig,
    transformers: [new ModelTransformer(), new HasManyTransformer(), new AuthTransformer()],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();

  expect(out.resolvers['Post.comments.auth.1.req.vtl']).toContain(
    '#set( $staticGroupRoles = [{"claim":"cognito:groups","entity":"admin"}] )',
  );
});

test(`ModelXConnection type is getting the directives added, when a field has @hasMany but one fo the types has no queries defined`, () => {
  const validSchema = `
  type User @model
     @auth(rules: [
       { allow: private, provider: iam, operations: [read] }
       { allow: groups, groups: ["group"], operations: [read, update, delete] },
     ]) {
     id: ID!
     posts: [Post!] @hasMany(indexName: "byUser", fields: ["id"])
   }
   type Post @model(queries: null)
    @auth(rules: [
      { allow: private, provider: iam, operations: [read] },
      { allow: groups, groups: ["group"], operations: [read, update, delete] }
    ]) {
    id: ID!
    postUserId: ID! @index(name: "byUser")
    message: String
  }`;
  const transformer = getTransformer(withAuthModes(iamDefaultConfig, ['AMAZON_COGNITO_USER_POOLS']));
  const out = transformer.transform(validSchema);
  const schemaDoc = parse(out.schema);
  const queryType = getObjectType(schemaDoc, 'Query');
  const mutationType = getObjectType(schemaDoc, 'Mutation');

  expectTwo(getField(queryType, 'getUser'), ['aws_iam', 'aws_cognito_user_pools']);
  expectTwo(getField(queryType, 'listUsers'), ['aws_iam', 'aws_cognito_user_pools']);

  expectNone(getField(mutationType, 'createUser'));
  expectOne(getField(mutationType, 'updateUser'), 'aws_cognito_user_pools');
  expectOne(getField(mutationType, 'deleteUser'), 'aws_cognito_user_pools');

  const userType = getObjectType(schemaDoc, 'User');
  expectTwo(userType, ['aws_iam', 'aws_cognito_user_pools']);
  expectNone(getField(userType, 'posts'));

  const modelPostConnectionType = getObjectType(schemaDoc, 'ModelPostConnection');
  expect(modelPostConnectionType).toBeDefined();
  expectTwo(modelPostConnectionType, ['aws_iam', 'aws_cognito_user_pools']);
});

test(`ModelXConnection type is getting the directives added, when a field has @connection but one of the types has no queries defined. Many to Many`, () => {
  const schema = `
  type Post @model @auth(rules: [{ allow: owner }]) {
    id: ID!
    title: String!
    editors: [PostEditor] @hasMany(indexName: "byPost", fields: ["id"])
  }
  # Create a join model and disable queries as you don't need them
  # and can query through Post.editors and User.posts
  type PostEditor
    @model(queries: null)
    @auth(rules: [{ allow: owner }]) {
    id: ID!
    postID: ID! @index(name: "byPost", sortKeyFields: ["editorID"])
    editorID: ID! @index(name: "byEditor", sortKeyFields: ["postID"])
    post: Post! @belongsTo(fields: ["postID"])
    editor: User! @belongsTo(fields: ["editorID"])
  }
  type User @model @auth(rules: [{ allow: owner }]) {
    id: ID!
    username: String!
    posts: [PostEditor] @hasMany(indexName: "byEditor", fields: ["id"])
  }`;

  const transformer = getTransformer(withAuthModes(apiKeyDefaultConfig, ['AMAZON_COGNITO_USER_POOLS']));
  const out = transformer.transform(schema);
  const schemaDoc = parse(out.schema);

  const modelPostEditorConnectionType = getObjectType(schemaDoc, 'ModelPostEditorConnection');
  expect(modelPostEditorConnectionType).toBeDefined();
  // since we have resolver level auth to deny providers the default is added here to ensure the access is granted if the default type is not applied on the parent
  // therefore we just need to make sure that the access is at least granted on the schema level
  expect((modelPostEditorConnectionType as any).directives.some((dir: any) => dir.name.value === 'aws_cognito_user_pools')).toBe(true);
});

const getTransformer = (authConfig: AppSyncAuthConfiguration) => {
  return new GraphQLTransform({
    authConfig,
    transformers: [
      new ModelTransformer(),
      new IndexTransformer(),
      new HasManyTransformer(),
      new BelongsToTransformer(),
      new AuthTransformer(),
    ],
  });
};

const withAuthModes = (authConfig: AppSyncAuthConfiguration, authModes: AppSyncAuthMode[]): AppSyncAuthConfiguration => {
  const newAuthConfig = {
    defaultAuthentication: {
      authenticationType: authConfig.defaultAuthentication.authenticationType,
    },
    additionalAuthenticationProviders: [],
  };

  for (const authMode of authModes) {
    const provider = { authenticationType: authMode };

    newAuthConfig.additionalAuthenticationProviders.push(provider as never);
  }

  return newAuthConfig;
};

const getObjectType = (doc: DocumentNode, type: string): ObjectTypeDefinitionNode | undefined => {
  return doc.definitions.find(def => def.kind === Kind.OBJECT_TYPE_DEFINITION && def.name.value === type) as
    | ObjectTypeDefinitionNode
    | undefined;
};

const getField = (type: any, name: string) => type.fields.find((f: any) => f.name.value === name);

const expectNone = (fieldOrType: any) => {
  expect(fieldOrType.directives.length === 0);
};

const expectOne = (fieldOrType: any, directiveName: string) => {
  expect(fieldOrType.directives.length).toBe(1);
  expect(fieldOrType.directives.find((d: any) => d.name.value === directiveName)).toBeDefined();
};

const expectTwo = (fieldOrType: any, directiveNames: string[]) => {
  expect(directiveNames).toBeDefined();
  expect(directiveNames).toHaveLength(2);
  expect(fieldOrType.directives.length === 2);
  expect(fieldOrType.directives.find((d: any) => d.name.value === directiveNames[0])).toBeDefined();
  expect(fieldOrType.directives.find((d: any) => d.name.value === directiveNames[1])).toBeDefined();
};
