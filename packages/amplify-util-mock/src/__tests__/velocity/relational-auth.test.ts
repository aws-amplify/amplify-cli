import { AuthTransformer } from '@aws-amplify/graphql-auth-transformer';
import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { PrimaryKeyTransformer, IndexTransformer } from '@aws-amplify/graphql-index-transformer';
import { HasManyTransformer, HasOneTransformer, BelongsToTransformer } from '@aws-amplify/graphql-relational-transformer';
import { GraphQLTransform } from '@aws-amplify/graphql-transformer-core';
import { AppSyncAuthConfiguration } from '@aws-amplify/graphql-transformer-interfaces';
import { AmplifyAppSyncSimulatorAuthenticationType, AppSyncGraphQLExecutionContext } from 'amplify-appsync-simulator';
import { VelocityTemplateSimulator, getJWTToken, getIAMToken } from '../../velocity';

const USER_POOL_ID = 'us-fake-1ID';

describe('relational tests', () => {
  let vtlTemplate: VelocityTemplateSimulator;
  let transformer: GraphQLTransform;
  const ownerRequest: AppSyncGraphQLExecutionContext = {
    requestAuthorizationMode: AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS,
    jwt: getJWTToken(USER_POOL_ID, 'user1', 'user1@test.com'),
    headers: {},
  };
  const adminGroupRequest: AppSyncGraphQLExecutionContext = {
    requestAuthorizationMode: AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS,
    jwt: getJWTToken(USER_POOL_ID, 'user2', 'user2@test.com', ['admin']),
    headers: {},
  };
  const iamAuthRole: AppSyncGraphQLExecutionContext = {
    requestAuthorizationMode: AmplifyAppSyncSimulatorAuthenticationType.AWS_IAM,
    iamToken: getIAMToken('authRole', {
      cognitoIdentityAuthProvider: `cognito-idp.us-fake1.amazonaws.com/${USER_POOL_ID}`,
      cognitoIdentityAuthType: 'authenticated',
      cognitoIdentityPoolId: `${USER_POOL_ID}:000-111-222`,
      cognitoIdentityId: 'us-fake-1:000',
    }),
    headers: {},
  };

  beforeEach(() => {
    const authConfig: AppSyncAuthConfiguration = {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [
        {
          authenticationType: 'AWS_IAM',
        },
      ],
    };
    transformer = new GraphQLTransform({
      authConfig,
      transformers: [
        new ModelTransformer(),
        new AuthTransformer(),
        new PrimaryKeyTransformer(),
        new IndexTransformer(),
        new HasManyTransformer(),
        new HasOneTransformer(),
        new BelongsToTransformer(),
      ],
    });
    vtlTemplate = new VelocityTemplateSimulator({ authConfig });
  });

  test('1:1 nested auth read', () => {
    // public signed user pools should only be able to read
    // blogs and they can't see the editor
    const validSchema = `
      type Blog @model @auth(rules: [{ allow: private, operations: [read], provider: userPools }]) {
        id: ID!
        name: String
        title: String        
        editor: Editor @hasOne(fields: ["id", "name"])
      }

      type Editor @model @auth(rules: [{ allow: owner }]) {
        id: ID! @primaryKey(sortKeyFields: ["name"])
        name: String!
        email: AWSEmail
      }`;

    const out = transformer.transform(validSchema);
    expect(out).toBeDefined();
    const listBlogTemplate = out.resolvers['Query.listBlogs.auth.1.req.vtl'];
    const blogEditor = out.resolvers['Blog.editor.auth.1.req.vtl'];

    // signed in as a cognito user should not yield unauthorized
    const upResponse = vtlTemplate.render(listBlogTemplate, { context: {}, requestParameters: ownerRequest });
    expect(upResponse.hadException).toBe(false);

    // signed in via iam will yield unauthorized
    const iamResponse = vtlTemplate.render(listBlogTemplate, { context: {}, requestParameters: iamAuthRole });
    expect(iamResponse.hadException).toBe(true);
    expect(iamResponse.errors[0].errorType).toEqual('Unauthorized');

    // query for blogEditor should have an owner rule filter
    const ownerFieldResponse = vtlTemplate.render(blogEditor, { context: {}, requestParameters: ownerRequest });
    expect(ownerFieldResponse.hadException).toBe(false);
    expect(ownerFieldResponse.stash.authFilter).toEqual(
      expect.objectContaining({
        or: [{ owner: { eq: 'user1' } }],
      }),
    );
  });

  test('1:M nested auth read', () => {
    // checking for the following cases
    // don't apply the authFilter if the owner is not in any valid groups
    // remove auth filter if the primaryRole (ex. the owner rule) condition is met
    // pass the auth filter if the primaryRole condition is not met

    const validSchema = `
    type Post @model @auth(rules: [{allow: owner}, { allow: groups, groupsField: "editors" }]) {
      id: ID!
      title: String!
      editors: [String]
      author: User @belongsTo(fields: ["owner"])
      owner: ID! @index(name: "byOwner", sortKeyFields: ["id"])
    }
    
    type User @model @auth(rules: [{ allow: owner }]) {
      id: ID!
      name: String
      posts: [Post] @hasMany(indexName: "byOwner", fields: ["id"])
    }`;
    const out = transformer.transform(validSchema);
    const userPostTemplate = out.resolvers['User.posts.auth.1.req.vtl'];

    // request as admin editor where the user is not the user in the record so therefore the auth filter is applied
    const adminWithFilterResponse = vtlTemplate.render(userPostTemplate, {
      context: {
        source: { id: 'user1' },
      },
      requestParameters: adminGroupRequest,
    });
    expect(adminWithFilterResponse.hadException).toEqual(false);
    expect(adminWithFilterResponse.stash.authFilter).toEqual(
      expect.objectContaining({
        or: [{ editors: { contains: 'admin' } }],
      }),
    );

    // response where the editor member is the owner therefore the auth filter does not need to be applied
    const adminWithNoFilterResponse = vtlTemplate.render(userPostTemplate, {
      context: {
        source: { id: 'user2' },
      },
      requestParameters: adminGroupRequest,
    });
    expect(adminWithNoFilterResponse.hadException).toEqual(false);
    expect(adminWithNoFilterResponse.stash.authFilter).toBeNull();

    // request as a user that is niether the owner nor has any valid groups
    // therefore the request is changed to include the current user to ensure they are only seeing their correct records
    // NOTE: will only really happen in the group claim rule is different than that of the related type therefore the owner rule should still be enforced
    const ownerWithNoFilter = vtlTemplate.render(userPostTemplate, {
      context: {
        source: { id: 'user3' },
      },
      requestParameters: ownerRequest,
    });
    expect(ownerWithNoFilter.hadException).toEqual(false);
    expect(ownerWithNoFilter.stash.authFilter).not.toBeDefined();
  });
});
