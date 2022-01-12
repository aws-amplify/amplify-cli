import { AuthTransformer } from '@aws-amplify/graphql-auth-transformer';
import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { GraphQLTransform } from '@aws-amplify/graphql-transformer-core';
import { AppSyncAuthConfiguration } from '@aws-amplify/graphql-transformer-interfaces';
import { AmplifyAppSyncSimulatorAuthenticationType, AppSyncGraphQLExecutionContext } from 'amplify-appsync-simulator';
import { VelocityTemplateSimulator, AppSyncVTLContext, getJWTToken, getIAMToken } from '../../velocity';

describe('admin roles query checks', () => {
  const ADMIN_UI_ROLE = 'us-fake-1_uuid_Full-access/CognitoIdentityCredentials';
  let vtlTemplate: VelocityTemplateSimulator;
  let transformer: GraphQLTransform;
  const adminFullAccessRequest: AppSyncGraphQLExecutionContext = {
    requestAuthorizationMode: AmplifyAppSyncSimulatorAuthenticationType.AWS_IAM,
    iamToken: getIAMToken('us-fake-1_uuid_Full-access'),
    headers: {},
  };

  const featureFlags = {
    getBoolean: jest.fn().mockImplementation((name, defaultValue) => {
      if (name === 'useSubForDefaultIdentityClaim') {
        return false;
      }
      return;
    }),
    getNumber: jest.fn(),
    getObject: jest.fn(),
    getString: jest.fn(),
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
        new AuthTransformer({
          adminRoles: [ADMIN_UI_ROLE],
        }),
      ],
      featureFlags,
    });

    vtlTemplate = new VelocityTemplateSimulator({ authConfig });
  });

  test('test schema with field auth', () => {
    const validSchema = `
      type Student @model @auth(rules: [{ allow: groups, groups: ["staff"] }, { allow: owner }]) {
        id: ID!
        name: String
        description: String
        secretValue: String @auth(rules: [{ allow: owner }])
      }`;
    const out = transformer.transform(validSchema);

    // field resolver
    const secretValueTemplate = out.resolvers['Student.secretValue.req.vtl'];
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
    const createStudentTemplate = out.resolvers['Mutation.createStudent.auth.1.req.vtl'];
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
