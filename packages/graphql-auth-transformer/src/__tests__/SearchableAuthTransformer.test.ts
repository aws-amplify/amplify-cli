import { GraphQLTransform } from 'graphql-transformer-core';
import { DynamoDBModelTransformer } from 'graphql-dynamodb-transformer';
import { ModelAuthTransformer } from '../ModelAuthTransformer';
import { SearchableModelTransformer } from 'graphql-elasticsearch-transformer';

test('test auth logic is enabled on owner/static rules in resposne es resolver', () => {
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
  const transformer = new GraphQLTransform({
    transformers: [
      new DynamoDBModelTransformer(),
      new SearchableModelTransformer(),
      new ModelAuthTransformer({
        authConfig: {
          defaultAuthentication: {
            authenticationType: 'AMAZON_COGNITO_USER_POOLS',
          },
          additionalAuthenticationProviders: [],
        },
      }),
    ],
  });

  const out = transformer.transform(validSchema);
  // expect response resolver to contain auth logic for owner rule
  expect(out).toBeDefined();
  expect(out.resolvers['Query.searchComments.res.vtl']).toContain(
    '## Authorization rule: { allow: owner, ownerField: "owner", identityClaim: "cognito:username" } **'
  );
  // expect response resolver to contain auth logic for group rule
  expect(out.resolvers['Query.searchComments.res.vtl']).toContain(
    '## Authorization rule: { allow: groups, groups: ["writer"], groupClaim: "cognito:groups" } **'
  );
});

test('test auth logic is enabled for iam/apiKey auth rules in response es resolver', () => {
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
  const transformer = new GraphQLTransform({
    transformers: [
      new DynamoDBModelTransformer(),
      new SearchableModelTransformer(),
      new ModelAuthTransformer({
        authConfig: {
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
        },
      }),
    ],
  });

  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.schema).toContain('SearchablePostConnection @aws_api_key @aws_iam');
  expect(out.schema).toMatchSnapshot();
});
