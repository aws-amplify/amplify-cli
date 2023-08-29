import { AuthTransformer } from '@aws-amplify/graphql-auth-transformer';
import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { AppSyncAuthConfiguration } from '@aws-amplify/graphql-transformer-interfaces';
import { AmplifyAppSyncSimulatorAuthenticationType, AppSyncGraphQLExecutionContext } from '@aws-amplify/amplify-appsync-simulator';
import { DeploymentResources } from '../../__e2e_v2__/test-synthesizer/deployment-resources';
import { testTransform } from '../v2-test-synthesizer/test-transform';
import { VelocityTemplateSimulator, AppSyncVTLContext, getGenericToken } from '../../velocity';

type TestTransform = {
  transform: (schema: string) => DeploymentResources;
};

jest.mock('@aws-amplify/amplify-prompts');

// oidc needs claim values to know where to check in the token otherwise it will use cognito defaults precendence order below
// - owner: 'username' -> 'cognito:username' -> default to null
// - group: 'cognito:groups' -> default to null or empty list
describe('@model + @auth with oidc provider', () => {
  let vtlTemplate: VelocityTemplateSimulator;
  let transformer: TestTransform;
  const subIdUser: AppSyncGraphQLExecutionContext = {
    requestAuthorizationMode: AmplifyAppSyncSimulatorAuthenticationType.OPENID_CONNECT,
    jwt: getGenericToken('randomIdUser', 'random@user.com'),
    headers: {},
  };
  const editorGroupMember: AppSyncGraphQLExecutionContext = {
    requestAuthorizationMode: AmplifyAppSyncSimulatorAuthenticationType.OPENID_CONNECT,
    jwt: getGenericToken('editorUser', 'editor0@user.com', ['Editor']),
    headers: {},
  };

  beforeEach(() => {
    const authConfig: AppSyncAuthConfiguration = {
      defaultAuthentication: {
        authenticationType: 'OPENID_CONNECT',
        openIDConnectConfig: {
          name: 'myOIDCProvider',
          issuerUrl: 'https://some-oidc-provider/auth',
          clientId: 'my-sample-client-id',
        },
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

  test('oidc default', () => {
    const validSchema = `
    # owner authorization with provider override
    type Profile @model @auth(rules: [{ allow: owner, provider: oidc, identityClaim: "sub" }]) {
      id: ID!
      displayName: String!
    }`;

    const createProfileInput: AppSyncVTLContext = {
      arguments: {
        input: {
          id: '001',
          displayName: 'FooBar',
        },
      },
    };

    const out = transformer.transform(validSchema);
    const createRequestTemplate = out.resolvers['Mutation.createProfile.auth.1.req.vtl'];
    const createRequestAsSubOwner = vtlTemplate.render(createRequestTemplate, {
      context: createProfileInput,
      requestParameters: subIdUser,
    });
    expect(createRequestAsSubOwner.hadException).toEqual(false);
    expect(createRequestAsSubOwner.args.input).toEqual(
      expect.objectContaining({
        id: '001',
        displayName: 'FooBar',
        owner: expect.any(String), // since its a uuid we just need to know the owner was added
      }),
    );
  });

  test('oidc static groups', () => {
    const validSchema = `
    type Comment @model @auth(rules: [{ allow: groups, groups: ["Editor"], groupClaim: "groups", provider: oidc }]) {
      id: ID
      content: String
    }`;
    const createCommentInput: AppSyncVTLContext = {
      arguments: {
        input: {
          id: '001',
          content: 'Foobar',
        },
      },
    };
    const getCommentArgs: AppSyncVTLContext = {
      arguments: {
        id: '001',
      },
    };
    const out = transformer.transform(validSchema);
    const createRequestTemplate = out.resolvers['Mutation.createComment.auth.1.req.vtl'];
    const getRequestTemplate = out.resolvers['Query.getComment.auth.1.req.vtl'];
    // mutations
    const createRequestAsEditor = vtlTemplate.render(createRequestTemplate, {
      context: createCommentInput,
      requestParameters: editorGroupMember,
    });
    expect(createRequestAsEditor.hadException).toEqual(false);
    const createRequestAsUser = vtlTemplate.render(createRequestTemplate, { context: createCommentInput, requestParameters: subIdUser });
    expect(createRequestAsUser.hadException).toEqual(true);
    // queries
    const getRequestAsEditor = vtlTemplate.render(getRequestTemplate, { context: getCommentArgs, requestParameters: editorGroupMember });
    expect(getRequestAsEditor.hadException).toEqual(false);
    const getRequestAsOwner = vtlTemplate.render(getRequestTemplate, { context: getCommentArgs, requestParameters: subIdUser });
    expect(getRequestAsOwner.hadException).toEqual(true);
  });
});

describe('with identity claim feature flag disabled', () => {
  describe('@model + @auth with oidc provider', () => {
    let vtlTemplate: VelocityTemplateSimulator;
    let transformer: TestTransform;
    const subIdUser: AppSyncGraphQLExecutionContext = {
      requestAuthorizationMode: AmplifyAppSyncSimulatorAuthenticationType.OPENID_CONNECT,
      jwt: getGenericToken('randomIdUser', 'random@user.com'),
      headers: {},
    };
    const editorGroupMember: AppSyncGraphQLExecutionContext = {
      requestAuthorizationMode: AmplifyAppSyncSimulatorAuthenticationType.OPENID_CONNECT,
      jwt: getGenericToken('editorUser', 'editor0@user.com', ['Editor']),
      headers: {},
    };

    beforeEach(() => {
      const authConfig: AppSyncAuthConfiguration = {
        defaultAuthentication: {
          authenticationType: 'OPENID_CONNECT',
          openIDConnectConfig: {
            name: 'myOIDCProvider',
            issuerUrl: 'https://some-oidc-provider/auth',
            clientId: 'my-sample-client-id',
          },
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

    test('oidc default', () => {
      const validSchema = `
      # owner authorization with provider override
      type Profile @model @auth(rules: [{ allow: owner, provider: oidc, identityClaim: "sub" }]) {
        id: ID!
        displayName: String!
      }`;

      const createProfileInput: AppSyncVTLContext = {
        arguments: {
          input: {
            id: '001',
            displayName: 'FooBar',
          },
        },
      };

      const out = transformer.transform(validSchema);
      const createRequestTemplate = out.resolvers['Mutation.createProfile.auth.1.req.vtl'];
      const createRequestAsSubOwner = vtlTemplate.render(createRequestTemplate, {
        context: createProfileInput,
        requestParameters: subIdUser,
      });
      expect(createRequestAsSubOwner.hadException).toEqual(false);
      expect(createRequestAsSubOwner.args.input).toEqual(
        expect.objectContaining({
          id: '001',
          displayName: 'FooBar',
          owner: expect.any(String), // since its a uuid we just need to know the owner was added
        }),
      );
    });

    test('oidc static groups', () => {
      const validSchema = `
      type Comment @model @auth(rules: [{ allow: groups, groups: ["Editor"], groupClaim: "groups", provider: oidc }]) {
        id: ID
        content: String
      }`;
      const createCommentInput: AppSyncVTLContext = {
        arguments: {
          input: {
            id: '001',
            content: 'Foobar',
          },
        },
      };
      const getCommentArgs: AppSyncVTLContext = {
        arguments: {
          id: '001',
        },
      };
      const out = transformer.transform(validSchema);
      const createRequestTemplate = out.resolvers['Mutation.createComment.auth.1.req.vtl'];
      const getRequestTemplate = out.resolvers['Query.getComment.auth.1.req.vtl'];
      // mutations
      const createRequestAsEditor = vtlTemplate.render(createRequestTemplate, {
        context: createCommentInput,
        requestParameters: editorGroupMember,
      });
      expect(createRequestAsEditor.hadException).toEqual(false);
      const createRequestAsUser = vtlTemplate.render(createRequestTemplate, { context: createCommentInput, requestParameters: subIdUser });
      expect(createRequestAsUser.hadException).toEqual(true);
      // queries
      const getRequestAsEditor = vtlTemplate.render(getRequestTemplate, { context: getCommentArgs, requestParameters: editorGroupMember });
      expect(getRequestAsEditor.hadException).toEqual(false);
      const getRequestAsOwner = vtlTemplate.render(getRequestTemplate, { context: getCommentArgs, requestParameters: subIdUser });
      expect(getRequestAsOwner.hadException).toEqual(true);
    });
  });
});
