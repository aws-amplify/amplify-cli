import { AuthTransformer } from '@aws-amplify/graphql-auth-transformer';
import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { AppSyncAuthConfiguration } from '@aws-amplify/graphql-transformer-interfaces';
import { AmplifyAppSyncSimulatorAuthenticationType, AppSyncGraphQLExecutionContext } from '@aws-amplify/amplify-appsync-simulator';
import { VelocityTemplateSimulator, AppSyncVTLContext, getIAMToken } from '../../velocity';
import { DeploymentResources } from '../../__e2e_v2__/test-synthesizer/deployment-resources';
import { testTransform } from '../v2-test-synthesizer/test-transform';

type TestTransform = {
  transform: (schema: string) => DeploymentResources;
};

jest.mock('@aws-amplify/amplify-prompts');

describe('admin roles query checks', () => {
  const ADMIN_UI_ROLE = 'us-fake-1_uuid_Full-access/CognitoIdentityCredentials';
  const MOCK_BEFORE_TEMPLATE = `$util.qr($ctx.stash.put("adminRoles", ["${ADMIN_UI_ROLE}"]))`;

  let vtlTemplate: VelocityTemplateSimulator;
  let transformer: TestTransform;
  const adminFullAccessRequest: AppSyncGraphQLExecutionContext = {
    requestAuthorizationMode: AmplifyAppSyncSimulatorAuthenticationType.AWS_IAM,
    iamToken: getIAMToken('us-fake-1_uuid_Full-access'),
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
    transformer = {
      transform: (schema: string) =>
        testTransform({
          schema,
          authConfig,
          synthParameters: { adminRoles: [ADMIN_UI_ROLE] },
          transformers: [new ModelTransformer(), new AuthTransformer()],
        }),
    };

    vtlTemplate = new VelocityTemplateSimulator({ authConfig });
  });

  test('schema with field auth', () => {
    const validSchema = `
      type Student @model @auth(rules: [{ allow: groups, groups: ["staff"] }, { allow: owner }]) {
        id: ID!
        name: String
        description: String
        secretValue: String @auth(rules: [{ allow: owner }])
      }`;
    const out = transformer.transform(validSchema);

    // field resolver
    const secretValueTemplate = [MOCK_BEFORE_TEMPLATE, out.resolvers['Student.secretValue.req.vtl']].join('\n');
    const iamFieldContext: AppSyncVTLContext = {
      source: {
        secretValue: 'secretValue001',
      },
    };

    const secretValueResponse = vtlTemplate.render(secretValueTemplate, {
      context: iamFieldContext,
      requestParameters: adminFullAccessRequest,
    });
    expect(secretValueResponse.hadException).toEqual(false);
    expect(secretValueResponse.result).toEqual('secretValue001');

    // mutation resolver
    const createStudentTemplate = [MOCK_BEFORE_TEMPLATE, out.resolvers['Mutation.createStudent.auth.1.req.vtl']].join('\n');
    const iamCreateContext: AppSyncVTLContext = {
      arguments: {
        input: {
          id: '001',
          name: 'student0',
          owner: 'student0',
        },
      },
    };
    const createStudentResponse = vtlTemplate.render(createStudentTemplate, {
      context: iamCreateContext,
      requestParameters: adminFullAccessRequest,
    });

    expect(createStudentResponse.hadException).toEqual(false);
    // we can exit early with a object since the next function will run the mutation request
    expect(createStudentResponse.result).toEqual('{}');
  });
});

describe('identity claim feature flag disabled', () => {
  describe('admin roles query checks', () => {
    const ADMIN_UI_ROLE = 'us-fake-1_uuid_Full-access/CognitoIdentityCredentials';
    const MOCK_BEFORE_TEMPLATE = `$util.qr($ctx.stash.put("adminRoles", ["${ADMIN_UI_ROLE}"]))`;

    let vtlTemplate: VelocityTemplateSimulator;
    let transformer: TestTransform;
    const adminFullAccessRequest: AppSyncGraphQLExecutionContext = {
      requestAuthorizationMode: AmplifyAppSyncSimulatorAuthenticationType.AWS_IAM,
      iamToken: getIAMToken('us-fake-1_uuid_Full-access'),
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
      transformer = {
        transform: (schema: string) =>
          testTransform({
            schema,
            authConfig,
            synthParameters: { adminRoles: [ADMIN_UI_ROLE] },
            transformers: [new ModelTransformer(), new AuthTransformer()],
          }),
      };

      vtlTemplate = new VelocityTemplateSimulator({ authConfig });
    });

    test('schema with field auth', () => {
      const validSchema = `
        type Student @model @auth(rules: [{ allow: groups, groups: ["staff"] }, { allow: owner }]) {
          id: ID!
          name: String
          description: String
          secretValue: String @auth(rules: [{ allow: owner }])
        }`;
      const out = transformer.transform(validSchema);

      // field resolver
      const secretValueTemplate = [MOCK_BEFORE_TEMPLATE, out.resolvers['Student.secretValue.req.vtl']].join('\n');
      const iamFieldContext: AppSyncVTLContext = {
        source: {
          secretValue: 'secretValue001',
        },
      };

      const secretValueResponse = vtlTemplate.render(secretValueTemplate, {
        context: iamFieldContext,
        requestParameters: adminFullAccessRequest,
      });
      expect(secretValueResponse.hadException).toEqual(false);
      expect(secretValueResponse.result).toEqual('secretValue001');

      // mutation resolver
      const createStudentTemplate = [MOCK_BEFORE_TEMPLATE, out.resolvers['Mutation.createStudent.auth.1.req.vtl']].join('\n');
      const iamCreateContext: AppSyncVTLContext = {
        arguments: {
          input: {
            id: '001',
            name: 'student0',
            owner: 'student0',
          },
        },
      };
      const createStudentResponse = vtlTemplate.render(createStudentTemplate, {
        context: iamCreateContext,
        requestParameters: adminFullAccessRequest,
      });

      expect(createStudentResponse.hadException).toEqual(false);
      // we can exit early with a object since the next function will run the mutation request
      expect(createStudentResponse.result).toEqual('{}');
    });
  });
});
