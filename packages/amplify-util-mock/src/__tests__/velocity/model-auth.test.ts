import { AuthTransformer } from '@aws-amplify/graphql-auth-transformer';
import { IndexTransformer, PrimaryKeyTransformer } from '@aws-amplify/graphql-index-transformer';
import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { AppSyncAuthConfiguration } from '@aws-amplify/graphql-transformer-interfaces';
import { AmplifyAppSyncSimulatorAuthenticationType, AppSyncGraphQLExecutionContext } from '@aws-amplify/amplify-appsync-simulator';
import { DeploymentResources } from '../../__e2e_v2__/test-synthesizer/deployment-resources';
import { testTransform } from '../v2-test-synthesizer/test-transform';
import { VelocityTemplateSimulator, AppSyncVTLContext, getJWTToken } from '../../velocity';

type TestTransform = {
  transform: (schema: string) => DeploymentResources;
};

jest.mock('@aws-amplify/amplify-prompts');

const USER_POOL_ID = 'us-fake-1ID';

describe('@model owner mutation checks', () => {
  let vtlTemplate: VelocityTemplateSimulator;
  let transformer: TestTransform;
  const ownerRequest: AppSyncGraphQLExecutionContext = {
    requestAuthorizationMode: AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS,
    jwt: getJWTToken(USER_POOL_ID, 'user1', 'user1@test.com'),
    headers: {},
    sourceIp: '',
  };

  beforeEach(() => {
    const authConfig: AppSyncAuthConfiguration = {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    };
    transformer = {
      transform: (schema: string) =>
        testTransform({
          schema,
          authConfig,
          transformers: [new ModelTransformer(), new AuthTransformer()],
        }),
    };
    vtlTemplate = new VelocityTemplateSimulator({ authConfig });
  });

  test('implicit owner with default owner field', () => {
    const validSchema = `
      type Post @model @auth(rules: [{ allow: owner }]) {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
      }`;
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined();
    // create the owner type
    const ownerContext: AppSyncVTLContext = {
      arguments: { input: { id: '001', title: 'sample' } },
    };

    // expect the query resolver to contain a filter for the owner
    const queryTemplate = out.resolvers['Query.listPosts.auth.1.req.vtl'];
    const queryResponse = vtlTemplate.render(queryTemplate, { context: {}, requestParameters: ownerRequest });
    expect(queryResponse).toBeDefined();
    expect(queryResponse.stash.hasAuth).toEqual(true);
    expect(queryResponse.stash.authFilter).toEqual(
      expect.objectContaining({
        or: [{ owner: { eq: `${ownerRequest.jwt.sub}::user1` } }, { owner: { eq: `${ownerRequest.jwt.sub}` } }, { owner: { eq: 'user1' } }],
      }),
    );

    const createRequestTemplate = out.resolvers['Mutation.createPost.auth.1.req.vtl'];
    const createVTLRequest = vtlTemplate.render(createRequestTemplate, { context: ownerContext, requestParameters: ownerRequest });
    expect(createVTLRequest).toBeDefined();
    expect(createVTLRequest.stash.hasAuth).toEqual(true);
    expect(createVTLRequest.args).toBeDefined();
    expect(createVTLRequest.hadException).toEqual(false);
    // since we have an owner rule we expect the owner field to be defined in the argument input
    expect(createVTLRequest.args.input.owner).toEqual(`${ownerRequest.jwt.sub}::user1`);

    const updateRequestTemplate = out.resolvers['Mutation.updatePost.auth.1.req.vtl'];
    const updateVTLRequest = vtlTemplate.render(updateRequestTemplate, { context: ownerContext, requestParameters: ownerRequest });
    expect(updateVTLRequest).toBeDefined();
    // here we expect a get item payload to verify the owner making the update request is valid
    expect(updateVTLRequest.result).toEqual(
      expect.objectContaining({
        key: { id: { S: '001' } },
        operation: 'GetItem',
        version: '2018-05-29',
      }),
    );
    // atm there is there is nothing in the stash yet
    expect(updateVTLRequest.stash).toEqual({});
    const updateResponseTemplate = out.resolvers['Mutation.updatePost.auth.1.res.vtl'];
    // response where the owner is indeed the owner
    const updateVTLResponse = vtlTemplate.render(updateResponseTemplate, {
      context: { ...ownerContext, result: { id: '001', owner: 'user1' } },
      requestParameters: ownerRequest,
    });
    expect(updateVTLResponse).toBeDefined();

    expect(updateVTLResponse.hadException).toEqual(false);
    expect(updateVTLResponse.stash.hasAuth).toEqual(true);
    // response where there is an error
    const updateVTLWithError = vtlTemplate.render(updateResponseTemplate, {
      context: { ...ownerContext, result: { id: '001', owner: 'user2' } },
      requestParameters: ownerRequest,
    });
    expect(updateVTLWithError).toBeDefined();
    expect(updateVTLWithError.hadException).toEqual(true);
    expect(updateVTLWithError.errors).toHaveLength(1);
    expect(updateVTLWithError.errors[0]).toEqual(
      expect.objectContaining({
        errorType: 'Unauthorized',
        message: expect.stringContaining('Unauthorized on $util.unauthorized()'),
      }),
    );
  });

  test('implicit owner with custom field', () => {
    const validSchema = `
      type Post @model @auth(rules: [{ allow: owner, ownerField: "editor" }]) {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
      }`;
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined();
    // create context and request
    const ownerContext: AppSyncVTLContext = {
      arguments: { input: { id: '001', title: 'sample' } },
    };

    const createRequestTemplate = out.resolvers['Mutation.createPost.auth.1.req.vtl'];
    const createVTLRequest = vtlTemplate.render(createRequestTemplate, { context: ownerContext, requestParameters: ownerRequest });
    expect(createVTLRequest).toBeDefined();
    expect(createVTLRequest.stash.hasAuth).toEqual(true);
    expect(createVTLRequest.args).toBeDefined();
    expect(createVTLRequest.hadException).toEqual(false);
    // since we have an owner rule we expect the owner field to be defined in the argument input
    expect(createVTLRequest.args.input.editor).toEqual(`${ownerRequest.jwt.sub}::user1`);
  });

  test('explicit owner with default field', () => {
    const validSchema = `
      type Post @model @auth(rules: [{ allow: owner }]) {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
        owner: String
      }`;
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined();
    // create context and request
    const ownerContext: AppSyncVTLContext = {
      arguments: { input: { id: '001', title: 'sample' } },
    };

    const createRequestTemplate = out.resolvers['Mutation.createPost.auth.1.req.vtl'];
    const createVTLRequest = vtlTemplate.render(createRequestTemplate, { context: ownerContext, requestParameters: ownerRequest });
    expect(createVTLRequest).toBeDefined();
    expect(createVTLRequest.stash.hasAuth).toEqual(true);
    expect(createVTLRequest.args).toBeDefined();
    expect(createVTLRequest.hadException).toEqual(false);
    // since we have an owner rule we expect the owner field to be defined in the argument input
    expect(createVTLRequest.args.input.owner).toEqual(`${ownerRequest.jwt.sub}::user1`);
  });

  test('explicit owner with custom field', () => {
    const validSchema = `
      type Post @model @auth(rules: [{ allow: owner, ownerField: "editor" }]) {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
        editor: String
      }`;
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined();
    // create context and request
    const ownerContext: AppSyncVTLContext = {
      arguments: { input: { id: '001', title: 'sample' } },
    };

    const createRequestTemplate = out.resolvers['Mutation.createPost.auth.1.req.vtl'];
    const createVTLRequest = vtlTemplate.render(createRequestTemplate, { context: ownerContext, requestParameters: ownerRequest });
    expect(createVTLRequest).toBeDefined();
    expect(createVTLRequest.stash.hasAuth).toEqual(true);
    expect(createVTLRequest.args).toBeDefined();
    expect(createVTLRequest.hadException).toEqual(false);
    // since we have an owner rule we expect the owner field to be defined in the argument input
    expect(createVTLRequest.args.input.editor).toEqual(`${ownerRequest.jwt.sub}::user1`);

    const differentOwnerContext: AppSyncVTLContext = { arguments: { input: { id: '001', title: 'sample', editor: 'user2' } } };
    const createVTLRequestWithErrors = vtlTemplate.render(createRequestTemplate, {
      context: differentOwnerContext,
      requestParameters: ownerRequest,
    });
    expect(createVTLRequestWithErrors).toBeDefined();
    expect(createVTLRequestWithErrors.hadException).toEqual(true);
    expect(createVTLRequestWithErrors.errors).toHaveLength(1);
    // should fail since the owner in the input is different than what is in the
    expect(createVTLRequestWithErrors.errors[0]).toEqual(
      expect.objectContaining({
        errorType: 'Unauthorized',
        message: expect.stringContaining('Unauthorized on $util.unauthorized()'),
      }),
    );
  });

  test('explicit owner using a custom list field', () => {
    const validSchema = `
      type Post @model @auth(rules: [{ allow: owner, ownerField: "editors" }]) {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
        editors: [String]
      }`;
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined();
    // create context and request
    const ownerContext: AppSyncVTLContext = {
      arguments: { input: { id: '001', title: 'sample' } },
    };

    const createRequestTemplate = out.resolvers['Mutation.createPost.auth.1.req.vtl'];
    expect(createRequestTemplate).toBeDefined();
    const createVTLRequest = vtlTemplate.render(createRequestTemplate, { context: ownerContext, requestParameters: ownerRequest });
    expect(createVTLRequest).toBeDefined();
    expect(createVTLRequest.stash.hasAuth).toEqual(true);
    expect(createVTLRequest.args).toBeDefined();
    expect(createVTLRequest.hadException).toEqual(false);
    // since we have an owner rule we expect the owner field to be defined in the argument input
    expect(createVTLRequest.args.input.editors).toEqual([`${ownerRequest.jwt.sub}::user1`]);

    // should fail if the list of users does not contain the currently signed user
    const failedCreateVTLRequest = vtlTemplate.render(createRequestTemplate, {
      context: {
        arguments: { input: { id: '001', title: 'sample', editors: ['user2'] } },
      },
      requestParameters: ownerRequest,
    });
    expect(failedCreateVTLRequest.hadException).toEqual(true);
    // should fail since the owner in the input is different than what is in the
    expect(failedCreateVTLRequest.errors[0]).toEqual(
      expect.objectContaining({
        errorType: 'Unauthorized',
        message: expect.stringContaining('Unauthorized on $util.unauthorized()'),
      }),
    );
  });
});

describe('@model operations', () => {
  let vtlTemplate: VelocityTemplateSimulator;
  let transformer: TestTransform;
  const ownerRequest: AppSyncGraphQLExecutionContext = {
    requestAuthorizationMode: AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS,
    jwt: getJWTToken(USER_POOL_ID, 'user1', 'user1@test.com'),
    headers: {},
    sourceIp: '',
  };
  const adminGroupRequest: AppSyncGraphQLExecutionContext = {
    requestAuthorizationMode: AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS,
    jwt: getJWTToken(USER_POOL_ID, 'user2', 'user2@test.com', ['admin']),
    headers: {},
    sourceIp: '',
  };
  const editorGroupRequest: AppSyncGraphQLExecutionContext = {
    requestAuthorizationMode: AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS,
    jwt: getJWTToken(USER_POOL_ID, 'user3', 'user3@test.com', ['editor']),
    headers: {},
    sourceIp: '',
  };
  const createPostInput = (owner?: string): AppSyncVTLContext => ({
    arguments: {
      input: {
        id: '001',
        name: 'sample',
        owner,
      },
    },
  });

  beforeEach(() => {
    const authConfig: AppSyncAuthConfiguration = {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    };
    transformer = {
      transform: (schema: string) =>
        testTransform({
          schema,
          authConfig,
          transformers: [new ModelTransformer(), new AuthTransformer()],
        }),
    };
    vtlTemplate = new VelocityTemplateSimulator({ authConfig });
  });

  test('explicit operations where create/delete restricted', () => {
    const validSchema = `
      type Post @model @auth(rules: [
        { allow: owner, operations: [create, read] },
        { allow: groups, groups: ["admin"] }]) {
        id: ID
        name: String
        owner: String
      }`;
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined();
    // load vtl templates
    const createRequestTemplate = out.resolvers['Mutation.createPost.auth.1.req.vtl'];
    const readRequestTemplate = out.resolvers['Query.listPosts.auth.1.req.vtl'];
    const updateResponseTemplate = out.resolvers['Mutation.updatePost.auth.1.res.vtl'];
    const deleteResponseTemplate = out.resolvers['Mutation.deletePost.auth.1.res.vtl'];

    // run create request as owner and admin
    // even though they are not the owner it will still pass as they one making the request is in the admin group
    const createRequestAsAdmin = vtlTemplate.render(createRequestTemplate, {
      context: createPostInput('owner2'),
      requestParameters: adminGroupRequest,
    });
    expect(createRequestAsAdmin).toBeDefined();
    expect(createRequestAsAdmin.hadException).toEqual(false);
    expect(createRequestAsAdmin.stash.hasAuth).toEqual(true);
    // run the create request as owner should fail if the input is different the signed in owner
    const createRequestAsOwner = vtlTemplate.render(createRequestTemplate, {
      context: createPostInput('user2'),
      requestParameters: ownerRequest,
    });
    expect(createRequestAsOwner.hadException).toEqual(true);
    expect(createRequestAsOwner.errors[0]).toEqual(
      expect.objectContaining({
        errorType: 'Unauthorized',
        message: expect.stringContaining('Unauthorized on $util.unauthorized()'),
      }),
    );
    // read request for admin should not contain the filter
    const readRequestAsAdmin = vtlTemplate.render(readRequestTemplate, { context: {}, requestParameters: adminGroupRequest });
    expect(readRequestAsAdmin.stash.hasAuth).toEqual(true);
    expect(readRequestAsAdmin.stash.authFilter).not.toBeDefined();
    const readRequestAsOwner = vtlTemplate.render(readRequestTemplate, { context: {}, requestParameters: ownerRequest });
    expect(readRequestAsOwner.stash.hasAuth).toEqual(true);
    expect(readRequestAsOwner.stash.authFilter).toEqual(
      expect.objectContaining({
        or: [{ owner: { eq: `${ownerRequest.jwt.sub}::user1` } }, { owner: { eq: `${ownerRequest.jwt.sub}` } }, { owner: { eq: 'user1' } }],
      }),
    );
    const ddbResponseResult: AppSyncVTLContext = { result: { id: '001', title: 'sample', owner: 'user1' } };
    // update should pass for admin even if they are not the owner of the record
    const updateResponseAsAdmin = vtlTemplate.render(updateResponseTemplate, {
      context: ddbResponseResult,
      requestParameters: adminGroupRequest,
    });
    expect(updateResponseAsAdmin.hadException).toEqual(false);
    expect(updateResponseAsAdmin.stash.hasAuth).toEqual(true);
    // update should fail for owner even though they are the owner of the record
    const updateResponseAsOwner = vtlTemplate.render(updateResponseTemplate, {
      context: ddbResponseResult,
      requestParameters: ownerRequest,
    });
    expect(updateResponseAsOwner.hadException).toEqual(true);
    // delete should pass for admin even if they are not the owner of the record
    const deleteResponseAsAdmin = vtlTemplate.render(deleteResponseTemplate, {
      context: ddbResponseResult,
      requestParameters: adminGroupRequest,
    });
    expect(deleteResponseAsAdmin.hadException).toEqual(false);
    // delete should fail for owner even though they are the owner of the record
    const deleteResponseAsOwner = vtlTemplate.render(deleteResponseTemplate, {
      context: ddbResponseResult,
      requestParameters: ownerRequest,
    });
    expect(deleteResponseAsOwner.hadException).toEqual(true);
  });

  test('owner restricts create/read and group restricts read/update/delete', () => {
    // NOTE: this means that you can only create a record for the same owner
    // you can't create a record for other owners even if your in the editor group
    const validSchema = `
      type Post @model @auth(rules: [
        { allow: owner, operations: [create, read] },
        { allow: groups, groups: ["editor"], operations: [read, update, delete] }]) {
        id: ID
        name: String
        owner: String
      }
    `;
    const out = transformer.transform(validSchema);
    // load vtl templates
    const createRequestTemplate = out.resolvers['Mutation.createPost.auth.1.req.vtl'];
    const readRequestTemplate = out.resolvers['Query.listPosts.auth.1.req.vtl'];
    const updateResponseTemplate = out.resolvers['Mutation.updatePost.auth.1.res.vtl'];
    const deleteResponseTemplate = out.resolvers['Mutation.deletePost.auth.1.res.vtl'];

    // check that a editor member can't create a post under another owner
    const createPostAsEditor = vtlTemplate.render(createRequestTemplate, {
      context: createPostInput('user1'),
      requestParameters: editorGroupRequest,
    });
    expect(createPostAsEditor.hadException).toEqual(true);
    // check that editor can read posts with no filter
    const readPostsAsEditor = vtlTemplate.render(readRequestTemplate, { context: {}, requestParameters: editorGroupRequest });
    expect(readPostsAsEditor.hadException).toEqual(false);
    expect(readPostsAsEditor.stash.authFilter).not.toBeDefined();
    // expect owner can read but with an auth filter
    const readPostsAsOwner = vtlTemplate.render(readRequestTemplate, { context: {}, requestParameters: ownerRequest });
    expect(readPostsAsOwner.hadException).toEqual(false);
    expect(readPostsAsOwner.stash.authFilter).toEqual(
      expect.objectContaining({
        or: [{ owner: { eq: `${ownerRequest.jwt.sub}::user1` } }, { owner: { eq: `${ownerRequest.jwt.sub}` } }, { owner: { eq: 'user1' } }],
      }),
    );
    // expect owner can't run update or delete
    const updateResponseAsOwner = vtlTemplate.render(updateResponseTemplate, {
      context: createPostInput('user1'),
      requestParameters: ownerRequest,
    });
    expect(updateResponseAsOwner.hadException).toEqual(true);
    const deleteResponseAsOwner = vtlTemplate.render(deleteResponseTemplate, {
      context: createPostInput('user1'),
      requestParameters: ownerRequest,
    });
    expect(deleteResponseAsOwner.hadException).toEqual(true);
    // expect editor to be able to run update and delete
    const updateResponseAsEditor = vtlTemplate.render(updateResponseTemplate, {
      context: createPostInput('user1'),
      requestParameters: editorGroupRequest,
    });
    expect(updateResponseAsEditor.hadException).toEqual(false);
    const deleteResponseAsEditor = vtlTemplate.render(deleteResponseTemplate, {
      context: createPostInput('user1'),
      requestParameters: editorGroupRequest,
    });
    expect(deleteResponseAsEditor.hadException).toEqual(false);
  });

  test('explicit operations where update restricted', () => {
    const validSchema = `
      type Post @model @auth(rules: [
        { allow: owner, operations: [create, read, delete] },
        ]) {
        id: ID
        name: String
        owner: String
      }`;
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined();
    // load vtl templates
    const createRequestTemplate = out.resolvers['Mutation.createPost.auth.1.req.vtl'];
    const readRequestTemplate = out.resolvers['Query.listPosts.auth.1.req.vtl'];
    const updateResponseTemplate = out.resolvers['Mutation.updatePost.auth.1.res.vtl'];
    const deleteResponseTemplate = out.resolvers['Mutation.deletePost.auth.1.res.vtl'];

    // run the create request as owner should fail if the input is different the signed in owner
    const createRequestAsNonOwner = vtlTemplate.render(createRequestTemplate, {
      context: createPostInput('user2'),
      requestParameters: ownerRequest,
    });
    expect(createRequestAsNonOwner.hadException).toEqual(true);

    const createRequestAsOwner = vtlTemplate.render(createRequestTemplate, {
      context: createPostInput('user1'),
      requestParameters: ownerRequest,
    });
    expect(createRequestAsOwner.hadException).toEqual(false);

    // read should have filter
    const readRequestAsOwner = vtlTemplate.render(readRequestTemplate, { context: {}, requestParameters: ownerRequest });
    expect(readRequestAsOwner.stash.hasAuth).toEqual(true);
    expect(readRequestAsOwner.stash.authFilter).toEqual(
      expect.objectContaining({
        or: [{ owner: { eq: `${ownerRequest.jwt.sub}::user1` } }, { owner: { eq: `${ownerRequest.jwt.sub}` } }, { owner: { eq: 'user1' } }],
      }),
    );

    // read should have filter
    const readRequestAsNonOwner = vtlTemplate.render(readRequestTemplate, { context: {}, requestParameters: adminGroupRequest });
    expect(readRequestAsNonOwner.stash.authFilter).toEqual(
      expect.objectContaining({
        or: [
          { owner: { eq: `${adminGroupRequest.jwt.sub}::user2` } },
          { owner: { eq: `${adminGroupRequest.jwt.sub}` } },
          { owner: { eq: 'user2' } },
        ],
      }),
    );

    // update should fail for owner
    const ddbUpdateResult: AppSyncVTLContext = {
      result: { id: '001', name: 'sample', owner: 'user1' },
      arguments: {
        input: {
          id: '001',
          name: 'sample',
        },
      },
    };
    const updateResponseAsOwner = vtlTemplate.render(updateResponseTemplate, {
      context: ddbUpdateResult,
      requestParameters: ownerRequest,
    });
    expect(updateResponseAsOwner.hadException).toEqual(true);

    // update should fail for NON owner
    const updateResponseAsNonOwner = vtlTemplate.render(updateResponseTemplate, {
      context: ddbUpdateResult,
      requestParameters: adminGroupRequest,
    });
    expect(updateResponseAsNonOwner.hadException).toEqual(true);

    // delete should fail for non owner
    const ddbDeleteResult: AppSyncVTLContext = {
      result: { id: '001', name: 'sample', owner: 'user1' },
    };
    const deleteResponseAsNonOwner = vtlTemplate.render(deleteResponseTemplate, {
      context: ddbDeleteResult,
      requestParameters: adminGroupRequest,
    });
    expect(deleteResponseAsNonOwner.hadException).toEqual(true);

    // delete should pass for owner
    const deleteResponseAsOwner = vtlTemplate.render(deleteResponseTemplate, {
      context: ddbDeleteResult,
      requestParameters: ownerRequest,
    });
    expect(deleteResponseAsOwner.hadException).toEqual(false);
    expect(deleteResponseAsOwner.stash.hasAuth).toEqual(true);
  });
});

describe('@model field auth', () => {
  let vtlTemplate: VelocityTemplateSimulator;
  let transformer: TestTransform;
  const ownerRequest: AppSyncGraphQLExecutionContext = {
    requestAuthorizationMode: AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS,
    jwt: getJWTToken(USER_POOL_ID, 'user1', 'user1@test.com'),
    headers: {},
    sourceIp: '',
  };
  const adminGroupRequest: AppSyncGraphQLExecutionContext = {
    requestAuthorizationMode: AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS,
    jwt: getJWTToken(USER_POOL_ID, 'user2', 'user2@test.com', ['admin']),
    headers: {},
    sourceIp: '',
  };
  beforeEach(() => {
    const authConfig: AppSyncAuthConfiguration = {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    };
    transformer = {
      transform: (schema: string) =>
        testTransform({
          schema,
          authConfig,
          transformers: [new ModelTransformer(), new AuthTransformer()],
        }),
    };
    vtlTemplate = new VelocityTemplateSimulator({ authConfig });
  });

  test('object level group auth + field level owner auth', () => {
    const validSchema = `
      type Student @model @auth(rules:[{ allow: groups, groups: ["admin"] }]) {
        id: ID @auth(rules: [{ allow: groups, groups: ["admin"] }, { allow: owner, operations: [read, update], identityClaim: "username" }])
        name: String
        email: String! @auth(rules: [{ allow: groups, groups: ["admin"] }, { allow: owner, operations: [read, update], identityClaim: "username" }])
        ssn: String
      }`;
    const out = transformer.transform(validSchema);
    const updateResponseTemplate = out.resolvers['Mutation.updateStudent.auth.1.res.vtl'];
    const updateContext: AppSyncVTLContext = {
      arguments: {
        input: {
          id: '001',
          email: 'myNewEmail',
          name: 'newName',
        },
      },
      result: {
        id: '001',
        email: 'user1@test.com',
        name: 'samplename', // eslint-disable-line
        owner: 'user1',
      },
    };
    const updateContextOwnerPass: AppSyncVTLContext = {
      ...updateContext,
      arguments: {
        input: {
          id: '001',
          email: 'newEmail@user1.com',
        },
      },
    };
    // update request should fail
    const updateResponseAsOwnerFailed = vtlTemplate.render(updateResponseTemplate, {
      context: updateContext,
      requestParameters: ownerRequest,
    });
    expect(updateResponseAsOwnerFailed.hadException).toEqual(true);
    expect(updateResponseAsOwnerFailed.errors[0].extensions).toEqual(
      expect.objectContaining({
        errorType: 'Unauthorized',
        message: 'Unauthorized on [name]',
      }),
    );
    // update request should pass if the owner is only modifying the allowed fields
    const updateResponseAsOwner = vtlTemplate.render(updateResponseTemplate, {
      context: updateContextOwnerPass,
      requestParameters: ownerRequest,
    });
    expect(updateResponseAsOwner.hadException).toEqual(false);
    // update request should pass for admin user
    const updateResponseAsAdmin = vtlTemplate.render(updateResponseTemplate, {
      context: updateContext,
      requestParameters: adminGroupRequest,
    });
    expect(updateResponseAsAdmin.hadException).toEqual(false);

    // field read checks
    const readFieldContext: AppSyncVTLContext = {
      source: {
        id: '001',
        owner: 'user1',
        name: 'nameSample',
        ssn: '000111111',
      },
    };
    ['name', 'ssn'].forEach((field) => {
      // expect owner to get denied on these fields
      const readFieldTemplate = out.resolvers[`Student.${field}.req.vtl`];
      const ownerReadResponse = vtlTemplate.render(readFieldTemplate, { context: readFieldContext, requestParameters: ownerRequest });
      expect(ownerReadResponse.hadException).toEqual(true);
      // expect admin to be allowed
      const adminReadResponse = vtlTemplate.render(readFieldTemplate, { context: readFieldContext, requestParameters: adminGroupRequest });
      expect(adminReadResponse.hadException).toEqual(false);
    });

    ['id', 'email'].forEach((field) => {
      // since the only two roles have access to these fields there are no field resolvers
      expect(out.resolvers?.[`Student.${field}.req.vtl`]).not.toBeDefined();
    });
  });

  test('should allow setting name to null field', () => {
    const validSchema = `
      type Post @model @auth(rules: [{ allow: owner, operations: [create, read] }]) {
        id: ID @auth(rules: [{ allow: owner, operations: [create, read, update, delete] }])
        name: String @auth(rules: [{ allow: owner, operations: [create, read, delete] }])
      }
    `;

    const out = transformer.transform(validSchema);
    expect(out).toBeDefined();

    // load vtl templates
    const createPostTemplate = out.resolvers['Mutation.createPost.auth.1.req.vtl'];
    const updatePostTemplate = out.resolvers['Mutation.updatePost.auth.1.res.vtl'];

    const createPostContext = {
      arguments: {
        input: {
          id: '001',
          name: 'sample',
        },
      },
    };
    const createPostRequest = vtlTemplate.render(createPostTemplate, {
      context: createPostContext,
      requestParameters: ownerRequest,
    });
    expect(createPostRequest.hadException).toEqual(false);

    const updatePostContext = {
      result: {
        id: '001',
        name: null,
        owner: 'user1',
      },
    };
    const updatePostRequest = vtlTemplate.render(updatePostTemplate, {
      context: updatePostContext,
      requestParameters: ownerRequest,
    });
    expect(updatePostRequest.hadException).toEqual(false);
  });

  test('should allow owner to update', () => {
    const validSchema = `
    type Post @model @auth(rules: [{ allow: owner, operations: [create, update, read] }]) {
      id: ID!
      name: String!
    }
    `;

    const out = transformer.transform(validSchema);
    expect(out).toBeDefined();

    // load vtl templates
    const createPostTemplate = out.resolvers['Mutation.createPost.auth.1.req.vtl'];
    const updatePostTemplate = out.resolvers['Mutation.updatePost.auth.1.res.vtl'];

    const createPostContext = {
      arguments: {
        input: {
          id: '001',
          name: 'sample',
        },
      },
    };
    const createPostRequest = vtlTemplate.render(createPostTemplate, {
      context: createPostContext,
      requestParameters: ownerRequest,
    });
    expect(createPostRequest.hadException).toEqual(false);

    const updatePostContext = {
      result: {
        id: '001',
        name: 'updated',
        owner: 'user1',
      },
    };
    const updatePostRequest = vtlTemplate.render(updatePostTemplate, {
      context: updatePostContext,
      requestParameters: ownerRequest,
    });
    expect(updatePostRequest.hadException).toEqual(false);
  });
});

describe('@model @primaryIndex @index auth', () => {
  let transformer: TestTransform;

  beforeEach(() => {
    const authConfig: AppSyncAuthConfiguration = {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    };
    transformer = {
      transform: (schema: string) =>
        testTransform({
          schema,
          authConfig,
          transformers: [new ModelTransformer(), new PrimaryKeyTransformer(), new IndexTransformer(), new AuthTransformer()],
        }),
    };
  });

  test('listX operations', () => {
    const validSchema = `
    type FamilyMember @model @auth(rules: [
      { allow: owner, ownerField: "parent", operations: [read] },
      { allow: owner, ownerField: "child", operations: [read] }
    ]){
      parent: ID! @primaryKey(sortKeyFields: ["child"]) @index(name: "byParent", queryField: "byParent")
      child: ID! @index(name: "byChild", queryField: "byChild")
      createdAt: AWSDateTime
      updatedAt: AWSDateTime
    }`;

    expect(() => {
      transformer.transform(validSchema);
    }).toThrow(
      "The primary key's sort key type 'child' cannot be used as an owner @auth field too. Please use another field for the sort key.",
    );
  });
});

describe('with identity claim feature flag disabled', () => {
  describe('@model owner mutation checks', () => {
    let vtlTemplate: VelocityTemplateSimulator;
    let transformer: TestTransform;
    const ownerRequest: AppSyncGraphQLExecutionContext = {
      requestAuthorizationMode: AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS,
      jwt: getJWTToken(USER_POOL_ID, 'user1', 'user1@test.com'),
      headers: {},
      sourceIp: '',
    };

    beforeEach(() => {
      const authConfig: AppSyncAuthConfiguration = {
        defaultAuthentication: {
          authenticationType: 'AMAZON_COGNITO_USER_POOLS',
        },
        additionalAuthenticationProviders: [],
      };
      transformer = {
        transform: (schema: string) =>
          testTransform({
            schema,
            authConfig,
            transformers: [new ModelTransformer(), new AuthTransformer()],
            transformParameters: {
              useSubUsernameForDefaultIdentityClaim: false,
            },
          }),
      };
      vtlTemplate = new VelocityTemplateSimulator({ authConfig });
    });

    test('implicit owner with default owner field', () => {
      const validSchema = `
        type Post @model @auth(rules: [{ allow: owner }]) {
          id: ID!
          title: String!
          createdAt: String
          updatedAt: String
        }`;
      const out = transformer.transform(validSchema);
      expect(out).toBeDefined();
      // create the owner type
      const ownerContext: AppSyncVTLContext = {
        arguments: { input: { id: '001', title: 'sample' } },
      };

      // expect the query resolver to contain a filter for the owner
      const queryTemplate = out.resolvers['Query.listPosts.auth.1.req.vtl'];
      const queryResponse = vtlTemplate.render(queryTemplate, { context: {}, requestParameters: ownerRequest });
      expect(queryResponse).toBeDefined();
      expect(queryResponse.stash.hasAuth).toEqual(true);
      expect(queryResponse.stash.authFilter).toEqual(
        expect.objectContaining({
          or: [{ owner: { eq: 'user1' } }],
        }),
      );

      const createRequestTemplate = out.resolvers['Mutation.createPost.auth.1.req.vtl'];
      const createVTLRequest = vtlTemplate.render(createRequestTemplate, { context: ownerContext, requestParameters: ownerRequest });
      expect(createVTLRequest).toBeDefined();
      expect(createVTLRequest.stash.hasAuth).toEqual(true);
      expect(createVTLRequest.args).toBeDefined();
      expect(createVTLRequest.hadException).toEqual(false);
      // since we have an owner rule we expect the owner field to be defined in the argument input
      expect(createVTLRequest.args.input.owner).toEqual('user1');

      const updateRequestTemplate = out.resolvers['Mutation.updatePost.auth.1.req.vtl'];
      const updateVTLRequest = vtlTemplate.render(updateRequestTemplate, { context: ownerContext, requestParameters: ownerRequest });
      expect(updateVTLRequest).toBeDefined();
      // here we expect a get item payload to verify the owner making the update request is valid
      expect(updateVTLRequest.result).toEqual(
        expect.objectContaining({
          key: { id: { S: '001' } },
          operation: 'GetItem',
          version: '2018-05-29',
        }),
      );
      // atm there is there is nothing in the stash yet
      expect(updateVTLRequest.stash).toEqual({});
      const updateResponseTemplate = out.resolvers['Mutation.updatePost.auth.1.res.vtl'];
      // response where the owner is indeed the owner
      const updateVTLResponse = vtlTemplate.render(updateResponseTemplate, {
        context: { ...ownerContext, result: { id: '001', owner: 'user1' } },
        requestParameters: ownerRequest,
      });
      expect(updateVTLResponse).toBeDefined();
      expect(updateVTLResponse.hadException).toEqual(false);
      expect(updateVTLResponse.stash.hasAuth).toEqual(true);
      // response where there is an error
      const updateVTLWithError = vtlTemplate.render(updateResponseTemplate, {
        context: { ...ownerContext, result: { id: '001', owner: 'user2' } },
        requestParameters: ownerRequest,
      });
      expect(updateVTLWithError).toBeDefined();
      expect(updateVTLWithError.hadException).toEqual(true);
      expect(updateVTLWithError.errors).toHaveLength(1);
      expect(updateVTLWithError.errors[0]).toEqual(
        expect.objectContaining({
          errorType: 'Unauthorized',
          message: expect.stringContaining('Unauthorized on $util.unauthorized()'),
        }),
      );
    });

    test('implicit owner with custom field', () => {
      const validSchema = `
        type Post @model @auth(rules: [{ allow: owner, ownerField: "editor" }]) {
          id: ID!
          title: String!
          createdAt: String
          updatedAt: String
        }`;
      const out = transformer.transform(validSchema);
      expect(out).toBeDefined();
      // create context and request
      const ownerContext: AppSyncVTLContext = {
        arguments: { input: { id: '001', title: 'sample' } },
      };

      const createRequestTemplate = out.resolvers['Mutation.createPost.auth.1.req.vtl'];
      const createVTLRequest = vtlTemplate.render(createRequestTemplate, { context: ownerContext, requestParameters: ownerRequest });
      expect(createVTLRequest).toBeDefined();
      expect(createVTLRequest.stash.hasAuth).toEqual(true);
      expect(createVTLRequest.args).toBeDefined();
      expect(createVTLRequest.hadException).toEqual(false);
      // since we have an owner rule we expect the owner field to be defined in the argument input
      expect(createVTLRequest.args.input.editor).toEqual('user1');
    });

    test('explicit owner with default field', () => {
      const validSchema = `
        type Post @model @auth(rules: [{ allow: owner }]) {
          id: ID!
          title: String!
          createdAt: String
          updatedAt: String
          owner: String
        }`;
      const out = transformer.transform(validSchema);
      expect(out).toBeDefined();
      // create context and request
      const ownerContext: AppSyncVTLContext = {
        arguments: { input: { id: '001', title: 'sample' } },
      };

      const createRequestTemplate = out.resolvers['Mutation.createPost.auth.1.req.vtl'];
      const createVTLRequest = vtlTemplate.render(createRequestTemplate, { context: ownerContext, requestParameters: ownerRequest });
      expect(createVTLRequest).toBeDefined();
      expect(createVTLRequest.stash.hasAuth).toEqual(true);
      expect(createVTLRequest.args).toBeDefined();
      expect(createVTLRequest.hadException).toEqual(false);
      // since we have an owner rule we expect the owner field to be defined in the argument input
      expect(createVTLRequest.args.input.owner).toEqual('user1');
    });

    test('explicit owner with custom field', () => {
      const validSchema = `
        type Post @model @auth(rules: [{ allow: owner, ownerField: "editor" }]) {
          id: ID!
          title: String!
          createdAt: String
          updatedAt: String
          editor: String
        }`;
      const out = transformer.transform(validSchema);
      expect(out).toBeDefined();
      // create context and request
      const ownerContext: AppSyncVTLContext = {
        arguments: { input: { id: '001', title: 'sample' } },
      };

      const createRequestTemplate = out.resolvers['Mutation.createPost.auth.1.req.vtl'];
      const createVTLRequest = vtlTemplate.render(createRequestTemplate, { context: ownerContext, requestParameters: ownerRequest });
      expect(createVTLRequest).toBeDefined();
      expect(createVTLRequest.stash.hasAuth).toEqual(true);
      expect(createVTLRequest.args).toBeDefined();
      expect(createVTLRequest.hadException).toEqual(false);
      // since we have an owner rule we expect the owner field to be defined in the argument input
      expect(createVTLRequest.args.input.editor).toEqual('user1');

      const differentOwnerContext: AppSyncVTLContext = { arguments: { input: { id: '001', title: 'sample', editor: 'user2' } } };
      const createVTLRequestWithErrors = vtlTemplate.render(createRequestTemplate, {
        context: differentOwnerContext,
        requestParameters: ownerRequest,
      });
      expect(createVTLRequestWithErrors).toBeDefined();
      expect(createVTLRequestWithErrors.hadException).toEqual(true);
      expect(createVTLRequestWithErrors.errors).toHaveLength(1);
      // should fail since the owner in the input is different than what is in the
      expect(createVTLRequestWithErrors.errors[0]).toEqual(
        expect.objectContaining({
          errorType: 'Unauthorized',
          message: expect.stringContaining('Unauthorized on $util.unauthorized()'),
        }),
      );
    });

    test('explicit owner using a custom list field', () => {
      const validSchema = `
        type Post @model @auth(rules: [{ allow: owner, ownerField: "editors" }]) {
          id: ID!
          title: String!
          createdAt: String
          updatedAt: String
          editors: [String]
        }`;
      const out = transformer.transform(validSchema);
      expect(out).toBeDefined();
      // create context and request
      const ownerContext: AppSyncVTLContext = {
        arguments: { input: { id: '001', title: 'sample' } },
      };

      const createRequestTemplate = out.resolvers['Mutation.createPost.auth.1.req.vtl'];
      expect(createRequestTemplate).toBeDefined();
      const createVTLRequest = vtlTemplate.render(createRequestTemplate, { context: ownerContext, requestParameters: ownerRequest });
      expect(createVTLRequest).toBeDefined();
      expect(createVTLRequest.stash.hasAuth).toEqual(true);
      expect(createVTLRequest.args).toBeDefined();
      expect(createVTLRequest.hadException).toEqual(false);
      // since we have an owner rule we expect the owner field to be defined in the argument input
      expect(createVTLRequest.args.input.editors).toEqual(['user1']);

      // should fail if the list of users does not contain the currently signed user
      const failedCreateVTLRequest = vtlTemplate.render(createRequestTemplate, {
        context: {
          arguments: { input: { id: '001', title: 'sample', editors: ['user2'] } },
        },
        requestParameters: ownerRequest,
      });
      expect(failedCreateVTLRequest.hadException).toEqual(true);
      // should fail since the owner in the input is different than what is in the
      expect(failedCreateVTLRequest.errors[0]).toEqual(
        expect.objectContaining({
          errorType: 'Unauthorized',
          message: expect.stringContaining('Unauthorized on $util.unauthorized()'),
        }),
      );
    });
  });

  describe('@model operations', () => {
    let vtlTemplate: VelocityTemplateSimulator;
    let transformer: { transform: (schema: string) => DeploymentResources };
    const ownerRequest: AppSyncGraphQLExecutionContext = {
      requestAuthorizationMode: AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS,
      jwt: getJWTToken(USER_POOL_ID, 'user1', 'user1@test.com'),
      headers: {},
      sourceIp: '',
    };
    const adminGroupRequest: AppSyncGraphQLExecutionContext = {
      requestAuthorizationMode: AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS,
      jwt: getJWTToken(USER_POOL_ID, 'user2', 'user2@test.com', ['admin']),
      headers: {},
      sourceIp: '',
    };
    const editorGroupRequest: AppSyncGraphQLExecutionContext = {
      requestAuthorizationMode: AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS,
      jwt: getJWTToken(USER_POOL_ID, 'user3', 'user3@test.com', ['editor']),
      headers: {},
      sourceIp: '',
    };
    const createPostInput = (owner?: string): AppSyncVTLContext => ({
      arguments: {
        input: {
          id: '001',
          name: 'sample',
          owner,
        },
      },
    });

    beforeEach(() => {
      const authConfig: AppSyncAuthConfiguration = {
        defaultAuthentication: {
          authenticationType: 'AMAZON_COGNITO_USER_POOLS',
        },
        additionalAuthenticationProviders: [],
      };
      transformer = {
        transform: (schema: string) =>
          testTransform({
            schema,
            authConfig,
            transformers: [new ModelTransformer(), new AuthTransformer()],
            transformParameters: {
              useSubUsernameForDefaultIdentityClaim: false,
            },
          }),
      };
      vtlTemplate = new VelocityTemplateSimulator({ authConfig });
    });

    test('explicit operations where create/delete restricted', () => {
      const validSchema = `
        type Post @model @auth(rules: [
          { allow: owner, operations: [create, read] },
          { allow: groups, groups: ["admin"] }]) {
          id: ID
          name: String
          owner: String
        }`;
      const out = transformer.transform(validSchema);
      expect(out).toBeDefined();
      // load vtl templates
      const createRequestTemplate = out.resolvers['Mutation.createPost.auth.1.req.vtl'];
      const readRequestTemplate = out.resolvers['Query.listPosts.auth.1.req.vtl'];
      const updateResponseTemplate = out.resolvers['Mutation.updatePost.auth.1.res.vtl'];
      const deleteResponseTemplate = out.resolvers['Mutation.deletePost.auth.1.res.vtl'];

      // run create request as owner and admin
      // even though they are not the owner it will still pass as they one making the request is in the admin group
      const createRequestAsAdmin = vtlTemplate.render(createRequestTemplate, {
        context: createPostInput('owner2'),
        requestParameters: adminGroupRequest,
      });
      expect(createRequestAsAdmin).toBeDefined();
      expect(createRequestAsAdmin.hadException).toEqual(false);
      expect(createRequestAsAdmin.stash.hasAuth).toEqual(true);
      // run the create request as owner should fail if the input is different the signed in owner
      const createRequestAsOwner = vtlTemplate.render(createRequestTemplate, {
        context: createPostInput('user2'),
        requestParameters: ownerRequest,
      });
      expect(createRequestAsOwner.hadException).toEqual(true);
      expect(createRequestAsOwner.errors[0]).toEqual(
        expect.objectContaining({
          errorType: 'Unauthorized',
          message: expect.stringContaining('Unauthorized on $util.unauthorized()'),
        }),
      );
      // read request for admin should not contain the filter
      const readRequestAsAdmin = vtlTemplate.render(readRequestTemplate, { context: {}, requestParameters: adminGroupRequest });
      expect(readRequestAsAdmin.stash.hasAuth).toEqual(true);
      expect(readRequestAsAdmin.stash.authFilter).not.toBeDefined();
      const readRequestAsOwner = vtlTemplate.render(readRequestTemplate, { context: {}, requestParameters: ownerRequest });
      expect(readRequestAsOwner.stash.hasAuth).toEqual(true);
      expect(readRequestAsOwner.stash.authFilter).toEqual(
        expect.objectContaining({
          or: [{ owner: { eq: 'user1' } }],
        }),
      );
      const ddbResponseResult: AppSyncVTLContext = { result: { id: '001', title: 'sample', owner: 'user1' } };
      // update should pass for admin even if they are not the owner of the record
      const updateResponseAsAdmin = vtlTemplate.render(updateResponseTemplate, {
        context: ddbResponseResult,
        requestParameters: adminGroupRequest,
      });
      expect(updateResponseAsAdmin.hadException).toEqual(false);
      expect(updateResponseAsAdmin.stash.hasAuth).toEqual(true);
      // update should fail for owner even though they are the owner of the record
      const updateResponseAsOwner = vtlTemplate.render(updateResponseTemplate, {
        context: ddbResponseResult,
        requestParameters: ownerRequest,
      });
      expect(updateResponseAsOwner.hadException).toEqual(true);
      // delete should pass for admin even if they are not the owner of the record
      const deleteResponseAsAdmin = vtlTemplate.render(deleteResponseTemplate, {
        context: ddbResponseResult,
        requestParameters: adminGroupRequest,
      });
      expect(deleteResponseAsAdmin.hadException).toEqual(false);
      // delete should fail for owner even though they are the owner of the record
      const deleteResponseAsOwner = vtlTemplate.render(deleteResponseTemplate, {
        context: ddbResponseResult,
        requestParameters: ownerRequest,
      });
      expect(deleteResponseAsOwner.hadException).toEqual(true);
    });

    test('owner restricts create/read and group restricts read/update/delete', () => {
      // NOTE: this means that you can only create a record for the same owner
      // you can't create a record for other owners even if your in the editor group
      const validSchema = `
        type Post @model @auth(rules: [
          { allow: owner, operations: [create, read] },
          { allow: groups, groups: ["editor"], operations: [read, update, delete] }]) {
          id: ID
          name: String
          owner: String
        }
      `;
      const out = transformer.transform(validSchema);
      // load vtl templates
      const createRequestTemplate = out.resolvers['Mutation.createPost.auth.1.req.vtl'];
      const readRequestTemplate = out.resolvers['Query.listPosts.auth.1.req.vtl'];
      const updateResponseTemplate = out.resolvers['Mutation.updatePost.auth.1.res.vtl'];
      const deleteResponseTemplate = out.resolvers['Mutation.deletePost.auth.1.res.vtl'];

      // check that a editor member can't create a post under another owner
      const createPostAsEditor = vtlTemplate.render(createRequestTemplate, {
        context: createPostInput('user1'),
        requestParameters: editorGroupRequest,
      });
      expect(createPostAsEditor.hadException).toEqual(true);
      // check that editor can read posts with no filter
      const readPostsAsEditor = vtlTemplate.render(readRequestTemplate, { context: {}, requestParameters: editorGroupRequest });
      expect(readPostsAsEditor.hadException).toEqual(false);
      expect(readPostsAsEditor.stash.authFilter).not.toBeDefined();
      // expect owner can read but with an auth filter
      const readPostsAsOwner = vtlTemplate.render(readRequestTemplate, { context: {}, requestParameters: ownerRequest });
      expect(readPostsAsOwner.hadException).toEqual(false);
      expect(readPostsAsOwner.stash.authFilter).toEqual(
        expect.objectContaining({
          or: [{ owner: { eq: 'user1' } }],
        }),
      );
      // expect owner can't run update or delete
      const updateResponseAsOwner = vtlTemplate.render(updateResponseTemplate, {
        context: createPostInput('user1'),
        requestParameters: ownerRequest,
      });
      expect(updateResponseAsOwner.hadException).toEqual(true);
      const deleteResponseAsOwner = vtlTemplate.render(deleteResponseTemplate, {
        context: createPostInput('user1'),
        requestParameters: ownerRequest,
      });
      expect(deleteResponseAsOwner.hadException).toEqual(true);
      // expect editor to be able to run update and delete
      const updateResponseAsEditor = vtlTemplate.render(updateResponseTemplate, {
        context: createPostInput('user1'),
        requestParameters: editorGroupRequest,
      });
      expect(updateResponseAsEditor.hadException).toEqual(false);
      const deleteResponseAsEditor = vtlTemplate.render(deleteResponseTemplate, {
        context: createPostInput('user1'),
        requestParameters: editorGroupRequest,
      });
      expect(deleteResponseAsEditor.hadException).toEqual(false);
    });

    test('explicit operations where update restricted', () => {
      const validSchema = `
        type Post @model @auth(rules: [
          { allow: owner, operations: [create, read, delete] },
          ]) {
          id: ID
          name: String
          owner: String
        }`;
      const out = transformer.transform(validSchema);
      expect(out).toBeDefined();
      // load vtl templates
      const createRequestTemplate = out.resolvers['Mutation.createPost.auth.1.req.vtl'];
      const readRequestTemplate = out.resolvers['Query.listPosts.auth.1.req.vtl'];
      const updateResponseTemplate = out.resolvers['Mutation.updatePost.auth.1.res.vtl'];
      const deleteResponseTemplate = out.resolvers['Mutation.deletePost.auth.1.res.vtl'];

      // run the create request as owner should fail if the input is different the signed in owner
      const createRequestAsNonOwner = vtlTemplate.render(createRequestTemplate, {
        context: createPostInput('user2'),
        requestParameters: ownerRequest,
      });
      expect(createRequestAsNonOwner.hadException).toEqual(true);

      const createRequestAsOwner = vtlTemplate.render(createRequestTemplate, {
        context: createPostInput('user1'),
        requestParameters: ownerRequest,
      });
      expect(createRequestAsOwner.hadException).toEqual(false);

      // read should have filter
      const readRequestAsOwner = vtlTemplate.render(readRequestTemplate, { context: {}, requestParameters: ownerRequest });
      expect(readRequestAsOwner.stash.hasAuth).toEqual(true);
      expect(readRequestAsOwner.stash.authFilter).toEqual(
        expect.objectContaining({
          or: [{ owner: { eq: 'user1' } }],
        }),
      );

      // read should have filter
      const readRequestAsNonOwner = vtlTemplate.render(readRequestTemplate, { context: {}, requestParameters: adminGroupRequest });
      expect(readRequestAsNonOwner.stash.authFilter).toEqual(
        expect.objectContaining({
          or: [{ owner: { eq: 'user2' } }],
        }),
      );

      // update should fail for owner
      const ddbUpdateResult: AppSyncVTLContext = {
        result: { id: '001', name: 'sample', owner: 'user1' },
        arguments: {
          input: {
            id: '001',
            name: 'sample',
          },
        },
      };
      const updateResponseAsOwner = vtlTemplate.render(updateResponseTemplate, {
        context: ddbUpdateResult,
        requestParameters: ownerRequest,
      });
      expect(updateResponseAsOwner.hadException).toEqual(true);

      // update should fail for NON owner
      const updateResponseAsNonOwner = vtlTemplate.render(updateResponseTemplate, {
        context: ddbUpdateResult,
        requestParameters: adminGroupRequest,
      });
      expect(updateResponseAsNonOwner.hadException).toEqual(true);

      // delete should fail for non owner
      const ddbDeleteResult: AppSyncVTLContext = {
        result: { id: '001', name: 'sample', owner: 'user1' },
      };
      const deleteResponseAsNonOwner = vtlTemplate.render(deleteResponseTemplate, {
        context: ddbDeleteResult,
        requestParameters: adminGroupRequest,
      });
      expect(deleteResponseAsNonOwner.hadException).toEqual(true);

      // delete should pass for owner
      const deleteResponseAsOwner = vtlTemplate.render(deleteResponseTemplate, {
        context: ddbDeleteResult,
        requestParameters: ownerRequest,
      });
      expect(deleteResponseAsOwner.hadException).toEqual(false);
      expect(deleteResponseAsOwner.stash.hasAuth).toEqual(true);
    });
  });

  describe('@model field auth', () => {
    let vtlTemplate: VelocityTemplateSimulator;
    let transformer: TestTransform;
    const ownerRequest: AppSyncGraphQLExecutionContext = {
      requestAuthorizationMode: AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS,
      jwt: getJWTToken(USER_POOL_ID, 'user1', 'user1@test.com'),
      headers: {},
      sourceIp: '',
    };
    const adminGroupRequest: AppSyncGraphQLExecutionContext = {
      requestAuthorizationMode: AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS,
      jwt: getJWTToken(USER_POOL_ID, 'user2', 'user2@test.com', ['admin']),
      headers: {},
      sourceIp: '',
    };
    beforeEach(() => {
      const authConfig: AppSyncAuthConfiguration = {
        defaultAuthentication: {
          authenticationType: 'AMAZON_COGNITO_USER_POOLS',
        },
        additionalAuthenticationProviders: [],
      };
      transformer = {
        transform: (schema: string) =>
          testTransform({
            schema,
            authConfig,
            transformers: [new ModelTransformer(), new AuthTransformer()],
          }),
      };
      vtlTemplate = new VelocityTemplateSimulator({ authConfig });
    });

    test('object level group auth + field level owner auth', () => {
      const validSchema = `
        type Student @model @auth(rules:[{ allow: groups, groups: ["admin"] }]) {
          id: ID @auth(rules: [{ allow: groups, groups: ["admin"] }, { allow: owner, operations: [read, update] }])
          name: String
          email: String! @auth(rules: [{ allow: groups, groups: ["admin"] }, { allow: owner, operations: [read, update] }])
          ssn: String
        }`;
      const out = transformer.transform(validSchema);
      const updateResponseTemplate = out.resolvers['Mutation.updateStudent.auth.1.res.vtl'];
      const updateContext: AppSyncVTLContext = {
        arguments: {
          input: {
            id: '001',
            email: 'myNewEmail',
            name: 'newName',
          },
        },
        result: {
          id: '001',
          email: 'user1@test.com',
          name: 'samplename', // eslint-disable-line
          owner: 'user1',
        },
      };
      const updateContextOwnerPass: AppSyncVTLContext = {
        ...updateContext,
        arguments: {
          input: {
            id: '001',
            email: 'newEmail@user1.com',
          },
        },
      };
      // update request should fail
      const updateResponseAsOwnerFailed = vtlTemplate.render(updateResponseTemplate, {
        context: updateContext,
        requestParameters: ownerRequest,
      });
      expect(updateResponseAsOwnerFailed.hadException).toEqual(true);
      expect(updateResponseAsOwnerFailed.errors[0].extensions).toEqual(
        expect.objectContaining({
          errorType: 'Unauthorized',
          message: 'Unauthorized on [name]',
        }),
      );
      // update request should pass if the owner is only modifying the allowed fields
      const updateResponseAsOwner = vtlTemplate.render(updateResponseTemplate, {
        context: updateContextOwnerPass,
        requestParameters: ownerRequest,
      });
      expect(updateResponseAsOwner.hadException).toEqual(false);
      // update request should pass for admin user
      const updateResponseAsAdmin = vtlTemplate.render(updateResponseTemplate, {
        context: updateContext,
        requestParameters: adminGroupRequest,
      });
      expect(updateResponseAsAdmin.hadException).toEqual(false);

      // field read checks
      const readFieldContext: AppSyncVTLContext = {
        source: {
          id: '001',
          owner: 'user1',
          name: 'nameSample',
          ssn: '000111111',
        },
      };
      ['name', 'ssn'].forEach((field) => {
        // expect owner to get denied on these fields
        const readFieldTemplate = out.resolvers[`Student.${field}.req.vtl`];
        const ownerReadResponse = vtlTemplate.render(readFieldTemplate, { context: readFieldContext, requestParameters: ownerRequest });
        expect(ownerReadResponse.hadException).toEqual(true);
        // expect admin to be allowed
        const adminReadResponse = vtlTemplate.render(readFieldTemplate, {
          context: readFieldContext,
          requestParameters: adminGroupRequest,
        });
        expect(adminReadResponse.hadException).toEqual(false);
      });

      ['id', 'email'].forEach((field) => {
        // since the only two roles have access to these fields there are no field resolvers
        expect(out.resolvers?.[`Student.${field}.req.vtl`]).not.toBeDefined();
      });
    });

    test('should allow setting name to null field', () => {
      const validSchema = `
        type Post @model @auth(rules: [{ allow: owner, operations: [create, read] }]) {
          id: ID @auth(rules: [{ allow: owner, operations: [create, read, update, delete] }])
          name: String @auth(rules: [{ allow: owner, operations: [create, read, delete] }])
        }
      `;

      const out = transformer.transform(validSchema);
      expect(out).toBeDefined();

      // load vtl templates
      const createPostTemplate = out.resolvers['Mutation.createPost.auth.1.req.vtl'];
      const updatePostTemplate = out.resolvers['Mutation.updatePost.auth.1.res.vtl'];

      const createPostContext = {
        arguments: {
          input: {
            id: '001',
            name: 'sample',
          },
        },
      };
      const createPostRequest = vtlTemplate.render(createPostTemplate, {
        context: createPostContext,
        requestParameters: ownerRequest,
      });
      expect(createPostRequest.hadException).toEqual(false);

      const updatePostContext = {
        result: {
          id: '001',
          name: null,
          owner: 'user1',
        },
      };
      const updatePostRequest = vtlTemplate.render(updatePostTemplate, {
        context: updatePostContext,
        requestParameters: ownerRequest,
      });
      expect(updatePostRequest.hadException).toEqual(false);
    });

    test('should allow owner to update', () => {
      const validSchema = `
      type Post @model @auth(rules: [{ allow: owner, operations: [create, update, read] }]) {
        id: ID!
        name: String!
      }
      `;

      const out = transformer.transform(validSchema);
      expect(out).toBeDefined();

      // load vtl templates
      const createPostTemplate = out.resolvers['Mutation.createPost.auth.1.req.vtl'];
      const updatePostTemplate = out.resolvers['Mutation.updatePost.auth.1.res.vtl'];

      const createPostContext = {
        arguments: {
          input: {
            id: '001',
            name: 'sample',
          },
        },
      };
      const createPostRequest = vtlTemplate.render(createPostTemplate, {
        context: createPostContext,
        requestParameters: ownerRequest,
      });
      expect(createPostRequest.hadException).toEqual(false);

      const updatePostContext = {
        result: {
          id: '001',
          name: 'updated',
          owner: 'user1',
        },
      };
      const updatePostRequest = vtlTemplate.render(updatePostTemplate, {
        context: updatePostContext,
        requestParameters: ownerRequest,
      });
      expect(updatePostRequest.hadException).toEqual(false);
    });
  });

  describe('@model @primaryIndex @index auth', () => {
    let vtlTemplate: VelocityTemplateSimulator;
    let transformer: TestTransform;

    const ownerRequest: AppSyncGraphQLExecutionContext = {
      requestAuthorizationMode: AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS,
      jwt: getJWTToken(USER_POOL_ID, 'user1', 'user1@test.com'),
      headers: {},
      sourceIp: '',
    };

    beforeEach(() => {
      const authConfig: AppSyncAuthConfiguration = {
        defaultAuthentication: {
          authenticationType: 'AMAZON_COGNITO_USER_POOLS',
        },
        additionalAuthenticationProviders: [],
      };
      transformer = {
        transform: (schema: string) =>
          testTransform({
            schema,
            authConfig,
            transformParameters: {
              useSubUsernameForDefaultIdentityClaim: false,
            },
            transformers: [new ModelTransformer(), new PrimaryKeyTransformer(), new IndexTransformer(), new AuthTransformer()],
          }),
      };
      vtlTemplate = new VelocityTemplateSimulator({ authConfig });
    });

    test('listX operations', () => {
      const validSchema = `
      type FamilyMember @model @auth(rules: [
        { allow: owner, ownerField: "parent", operations: [read] },
        { allow: owner, ownerField: "child", operations: [read] }
      ]){
        parent: ID! @primaryKey(sortKeyFields: ["child"]) @index(name: "byParent", queryField: "byParent")
        child: ID! @index(name: "byChild", queryField: "byChild")
        createdAt: AWSDateTime
        updatedAt: AWSDateTime
      }`;

      const out = transformer.transform(validSchema);
      expect(out).toBeDefined();

      // should expect no errors and there should be an auth filter
      const listAuthRequestTemplate = out.resolvers['Query.listFamilyMembers.auth.1.req.vtl'];
      expect(listAuthRequestTemplate).toBeDefined();
      let listAuthVTLRequest = vtlTemplate.render(listAuthRequestTemplate, {
        context: {},
        requestParameters: ownerRequest,
      });
      expect(listAuthVTLRequest.hadException).toEqual(false);
      expect(listAuthVTLRequest.stash.authFilter).toEqual(
        expect.objectContaining({
          or: expect.arrayContaining([
            expect.objectContaining({ child: { in: expect.arrayContaining([ownerRequest.jwt['cognito:username']]) } }),
            expect.objectContaining({ parent: { in: expect.arrayContaining([ownerRequest.jwt['cognito:username']]) } }),
          ]),
        }),
      );

      // should still change model query expression if the partition key is provided
      // adding the modelQueryExpression and arg to simulate partition key being added
      listAuthVTLRequest = vtlTemplate.render(listAuthRequestTemplate, {
        context: {
          arguments: {
            parent: 'user10',
          },
          stash: {
            modelQueryExpression: {
              expression: '#parent = :parent',
              expressionNames: {
                '#parent': 'parent',
              },
              expressionValues: {
                ':parent': {
                  S: '$ctx.args.parent',
                },
              },
            },
          },
        },
        requestParameters: ownerRequest,
      });
      expect(listAuthVTLRequest.hadException).toEqual(false);
      expect(listAuthVTLRequest.stash.authFilter).not.toBeDefined();
      // the $ctx.args.parent is not resolving in mock vtl engine
      // not an issue in the service the index e2e tests this scenario
      expect(listAuthVTLRequest.stash.modelQueryExpression).toMatchInlineSnapshot(`
        {
          "expression": "#parent = :parent AND #child = :child",
          "expressionNames": {
            "#child": "child",
            "#parent": "parent",
          },
          "expressionValues": {
            ":child": {
              "S": "user1",
            },
            ":parent": {
              "S": "$ctx.args.parent",
            },
          },
        }
      `);
    });
  });
});
