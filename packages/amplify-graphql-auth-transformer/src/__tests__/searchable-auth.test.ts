import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { SearchableModelTransformer } from '@aws-amplify/graphql-searchable-transformer';
import { GraphQLTransform } from '@aws-amplify/graphql-transformer-core';
import { AppSyncAuthConfiguration } from '@aws-amplify/graphql-transformer-interfaces';
import {
  DocumentNode, ObjectTypeDefinitionNode, Kind, FieldDefinitionNode, parse,
} from 'graphql';
import { AuthTransformer, SEARCHABLE_AGGREGATE_TYPES } from '..';
import { featureFlags } from './test-helpers';

jest.mock('amplify-prompts');

const getObjectType = (
  doc: DocumentNode,
  type: string,
):
  ObjectTypeDefinitionNode
  | undefined => doc.definitions.find(def => def.kind === Kind.OBJECT_TYPE_DEFINITION && def.name.value === type) as
    | ObjectTypeDefinitionNode
    | undefined;

const expectMultiple = (
  fieldOrType: ObjectTypeDefinitionNode | FieldDefinitionNode,
  directiveNames: string[],
): void => {
  expect(directiveNames).toBeDefined();
  expect(directiveNames).toHaveLength(directiveNames.length);
  expect(fieldOrType.directives.length).toEqual(directiveNames.length);
  directiveNames.forEach(directiveName => {
    expect(fieldOrType.directives).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: expect.objectContaining({ value: directiveName }),
        }),
      ]),
    );
  });
};

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
    transformers: [new ModelTransformer(), new SearchableModelTransformer(), new AuthTransformer()],
    featureFlags,
  });
  const out = transformer.transform(validSchema);
  // expect response resolver to contain auth logic for owner rule
  expect(out).toBeDefined();
  expect(out.resolvers['Query.searchComments.auth.1.req.vtl']).toContain(
    '#set( $ownerClaim0 = "$ownerClaim0:$currentClaim1" )',
  );
  expect(out.resolvers['Query.searchComments.auth.1.req.vtl']).toContain(
    '$util.qr($ownerClaimsList0.add($ownerClaim0))',
  );
  expect(out.resolvers['Query.searchComments.auth.1.req.vtl']).toContain(
    '"terms": $ownerClaimsList0,',
  );
  // expect response resolver to contain auth logic for group rule
  expect(out.resolvers['Query.searchComments.auth.1.req.vtl']).toContain(
    '#set( $staticGroupRoles = [{"claim":"cognito:groups","entity":"writer"}] )',
  );
});

test('auth logic is enabled for iam/apiKey auth rules', () => {
  const expectedDirectives = ['aws_api_key', 'aws_iam'];
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
    transformers: [new ModelTransformer(), new SearchableModelTransformer(), new AuthTransformer()],
    featureFlags,
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  expect(out.schema).toBeDefined();
  const schemaDoc = parse(out.schema);
  SEARCHABLE_AGGREGATE_TYPES.forEach(aggregateType => {
    expectMultiple(getObjectType(schemaDoc, aggregateType), expectedDirectives);
  });
  // expect the searchable types to have the auth directives for total providers
  // expect the allowed fields for agg to exclude secret
  expect(out.resolvers['Query.searchPosts.auth.1.req.vtl']).toContain(
    '#set( $allowedAggFields = ["createdAt","updatedAt","id","content"] )',
  );
});

describe('identity claim feature flag disabled', () => {
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
      transformers: [new ModelTransformer(), new SearchableModelTransformer(), new AuthTransformer()],
      featureFlags: {
        ...featureFlags,
        ...{ getBoolean: () => false },
      },
    });
    const out = transformer.transform(validSchema);
    // expect response resolver to contain auth logic for owner rule
    expect(out).toBeDefined();
    expect(out.resolvers['Query.searchComments.auth.1.req.vtl']).toContain(
      '"terms":       [$util.defaultIfNull($ctx.identity.claims.get("username"), $util.defaultIfNull($ctx.identity.claims.get("cognito:username"), "___xamznone____"))],',
    );
    // expect response resolver to contain auth logic for group rule
    expect(out.resolvers['Query.searchComments.auth.1.req.vtl']).toContain(
      '#set( $staticGroupRoles = [{"claim":"cognito:groups","entity":"writer"}] )',
    );
  });

  test('auth logic is enabled for iam/apiKey auth rules', () => {
    const expectedDirectives = ['aws_api_key', 'aws_iam'];
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
      transformers: [new ModelTransformer(), new SearchableModelTransformer(), new AuthTransformer()],
      featureFlags: {
        ...featureFlags,
        ...{ getBoolean: () => false },
      },
    });
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined();
    expect(out.schema).toBeDefined();
    const schemaDoc = parse(out.schema);
    SEARCHABLE_AGGREGATE_TYPES.forEach(aggregateType => {
      expectMultiple(getObjectType(schemaDoc, aggregateType), expectedDirectives);
    });
    // expect the searchable types to have the auth directives for total providers
    // expect the allowed fields for agg to exclude secret
    expect(out.resolvers['Query.searchPosts.auth.1.req.vtl']).toContain(
      '#set( $allowedAggFields = ["createdAt","updatedAt","id","content"] )',
    );
  });
});
