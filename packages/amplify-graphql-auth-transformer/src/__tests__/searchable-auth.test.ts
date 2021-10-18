import { AuthTransformer } from '@aws-amplify/graphql-auth-transformer';
import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { SearchableModelTransformer } from '@aws-amplify/graphql-searchable-transformer';
import { GraphQLTransform } from '@aws-amplify/graphql-transformer-core';
import { AppSyncAuthConfiguration } from '@aws-amplify/graphql-transformer-interfaces';

test('auth logic is enabled on owner/static rules in es request', () => {
  const validSchema = `
        type Comment @model
            @searchable
            @auth(rules: [
                { allow: owner }
                { allow: groups, groups: ["writer"]}
            ])
        {
            id: ID!
            content: String
        }
    `;
  const authConfig: AppSyncAuthConfiguration = {
    defaultAuthentication: {
      authenticationType: 'AMAZON_COGNITO_USER_POOLS',
    },
    additionalAuthenticationProviders: [],
  };
  const transformer = new GraphQLTransform({
    authConfig,
    transformers: [
      new ModelTransformer(),
      new SearchableModelTransformer(),
      new AuthTransformer({
        authConfig,
        addAwsIamAuthInOutputSchema: false,
      }),
    ],
  });
  const out = transformer.transform(validSchema);
  // expect response resolver to contain auth logic for owner rule
  expect(out).toBeDefined();
  expect(out.pipelineFunctions['Query.searchComments.auth.1.req.vtl']).toContain(
    '"terms":       [$util.defaultIfNull($ctx.identity.claims.get("username"), $util.defaultIfNull($ctx.identity.claims.get("cognito:username"), "___xamznone____"))],',
  );
  // expect response resolver to contain auth logic for group rule
  expect(out.pipelineFunctions['Query.searchComments.auth.1.req.vtl']).toContain(
    '#set( $staticGroupRoles = [{"claim":"cognito:groups","entity":"writer"}] )',
  );
});

test('auth logic is enabled for iam/apiKey auth rules', () => {
  const validSchema = `
        type Post @model
            @searchable
            @auth(rules: [
                { allow: public, provider: apiKey } # api key is allowed
                { allow: private, provider: iam } # auth roles are allowed
            ]) {
            id: ID!
            content: String
            secret: String @auth(rules: [{ allow: private, provider: iam }]) # only auth role can do crud on this
        }
    `;
  const authConfig: AppSyncAuthConfiguration = {
    defaultAuthentication: {
      authenticationType: 'AMAZON_COGNITO_USER_POOLS',
    },
    additionalAuthenticationProviders: [
      {
        authenticationType: 'API_KEY',
        apiKeyConfig: {
          description: 'E2E Test API Key',
          apiKeyExpirationDays: 300,
        },
      },
      {
        authenticationType: 'AWS_IAM',
      },
    ],
  };
  const transformer = new GraphQLTransform({
    authConfig,
    transformers: [
      new ModelTransformer(),
      new SearchableModelTransformer(),
      new AuthTransformer({
        authConfig,
        addAwsIamAuthInOutputSchema: false,
      }),
    ],
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.schema).toContain('SearchablePostConnection @aws_api_key @aws_iam');
});
