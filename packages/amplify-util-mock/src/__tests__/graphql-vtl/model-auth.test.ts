import { AuthTransformer } from '@aws-amplify/graphql-auth-transformer';
import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { GraphQLTransform } from '@aws-amplify/graphql-transformer-core';
import { AppSyncAuthConfiguration } from '@aws-amplify/graphql-transformer-interfaces';
import { AmplifyAppSyncSimulatorAuthenticationType, AppSyncGraphQLExecutionContext } from 'amplify-appsync-simulator';
import { VelocityTemplateSimulator, AppSyncVTLContext, getJWTToken } from '../../velocity';

const USER_POOL_ID = 'us-fake-1ID';

test('auth transformer validation happy case', () => {
  const authConfig: AppSyncAuthConfiguration = {
    defaultAuthentication: {
      authenticationType: 'AMAZON_COGNITO_USER_POOLS',
    },
    additionalAuthenticationProviders: [],
  };
  const validSchema = `
    type Post @model @auth(rules: [{ allow: owner }]) {
      id: ID!
      title: String!
      createdAt: String
      updatedAt: String
    }`;
  const transformer = new GraphQLTransform({
    authConfig,
    transformers: [new ModelTransformer(), new AuthTransformer()],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();

  // create the owner type
  const ownerContext: AppSyncVTLContext = {
    arguments: {
      input: {
        id: '001',
        title: 'sample',
      },
    },
  };
  const ownerRequestContext: AppSyncGraphQLExecutionContext = {
    jwt: getJWTToken(USER_POOL_ID, 'user1', 'user1@test.com'),
    headers: {},
    sourceIp: '',
    requestAuthorizationMode: AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS,
  };

  const createMutationTemplate = out.pipelineFunctions['Mutation.createPost.auth.1.req.vtl'];
  const createMutationVTL = new VelocityTemplateSimulator({
    authConfig,
    template: createMutationTemplate,
  });
  const mutationResult = createMutationVTL.render(ownerContext, ownerRequestContext);
  expect(mutationResult).toBeDefined();
  expect(mutationResult.stash.hasAuth).toEqual(true);
  expect(mutationResult.args).toBeDefined();
  expect(mutationResult.errors).toBeDefined();
  // since we have an owner rule we expect the owner field to be defined in the argument input
  expect(mutationResult.args.input.owner).toEqual('user1');

  // expect the query resolver to contain a filter for the owner
  const queryTemplate = out.pipelineFunctions['Query.listPosts.auth.1.req.vtl'];
  const queryVTL = new VelocityTemplateSimulator({
    authConfig,
    template: queryTemplate,
  });
  const queryResponse = queryVTL.render({}, ownerRequestContext);
  expect(queryResponse).toBeDefined();
  expect(queryResponse.stash.hasAuth).toEqual(true);
  expect(queryResponse.stash.authFilter).toEqual(
    expect.objectContaining({
      or: [{ owner: { eq: 'user1' } }],
    }),
  );
});
