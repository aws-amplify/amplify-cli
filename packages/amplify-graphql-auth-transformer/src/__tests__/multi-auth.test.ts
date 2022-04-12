import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { GraphQLTransform } from '@aws-amplify/graphql-transformer-core';
import { AppSyncAuthConfiguration, AppSyncAuthConfigurationOIDCEntry, AppSyncAuthMode } from '@aws-amplify/graphql-transformer-interfaces';
import {
  DocumentNode, ObjectTypeDefinitionNode, Kind, FieldDefinitionNode, parse, InputValueDefinitionNode,
} from 'graphql';
import { AuthTransformer } from '../graphql-auth-transformer';
import { featureFlags } from './test-helpers';

jest.mock('amplify-prompts');

const userPoolsDefaultConfig: AppSyncAuthConfiguration = {
  defaultAuthentication: {
    authenticationType: 'AMAZON_COGNITO_USER_POOLS',
  },
  additionalAuthenticationProviders: [],
};

const apiKeyDefaultConfig: AppSyncAuthConfiguration = {
  defaultAuthentication: {
    authenticationType: 'API_KEY',
  },
  additionalAuthenticationProviders: [],
};

const iamDefaultConfig: AppSyncAuthConfiguration = {
  defaultAuthentication: {
    authenticationType: 'AWS_IAM',
  },
  additionalAuthenticationProviders: [],
};

const withAuthModes = (authConfig: AppSyncAuthConfiguration, authModes: AppSyncAuthMode[]): AppSyncAuthConfiguration => {
  const newAuthConfig = {
    defaultAuthentication: {
      authenticationType: authConfig.defaultAuthentication.authenticationType,
    },
    additionalAuthenticationProviders: [],
  };

  authModes.forEach(authMode => {
    newAuthConfig.additionalAuthenticationProviders.push({
      authenticationType: authMode,
    });
  });

  return newAuthConfig;
};

const apiKeyDirectiveName = 'aws_api_key';
const userPoolsDirectiveName = 'aws_cognito_user_pools';
const iamDirectiveName = 'aws_iam';
const openIdDirectiveName = 'aws_oidc';

const multiAuthDirective = '@auth(rules: [{allow: private}, {allow: public}, {allow: private, provider: iam }, {allow: owner, provider: oidc }])';
const ownerAuthDirective = '@auth(rules: [{allow: owner}])';
const ownerWithIAMAuthDirective = '@auth(rules: [{allow: owner, provider: iam }])';
const ownerRestrictedPublicAuthDirective = '@auth(rules: [{allow: owner},{allow: public, operations: [read]}])';
const ownerRestrictedIAMPrivateAuthDirective = '@auth(rules: [{allow: owner},{allow: private, operations: [read], provider: iam }])';
const groupsAuthDirective = '@auth(rules: [{allow: groups, groups: ["admin"] }])';
const groupsWithApiKeyAuthDirective = '@auth(rules: [{allow: groups, groups: ["admin"]}, {allow: public, operations: [read]}])';
const groupsWithProviderAuthDirective = '@auth(rules: [{allow: groups,groups: ["admin"], provider: iam }])';
const ownerOpenIdAuthDirective = '@auth(rules: [{allow: owner, provider: oidc }])';
const privateAuthDirective = '@auth(rules: [{allow: private}])';
const publicIAMAuthDirective = '@auth(rules: [{allow: public, provider: iam }])';
const privateWithApiKeyAuthDirective = '@auth(rules: [{allow: private, provider: apiKey }])';
const publicAuthDirective = '@auth(rules: [{allow: public}])';
const publicUserPoolsAuthDirective = '@auth(rules: [{allow: public, provider: userPools}])';
const privateAndPublicDirective = '@auth(rules: [{allow: private}, {allow: public}])';
const privateIAMDirective = '@auth(rules: [{allow: private, provider: iam}])';
// const privateAndPrivateIAMDirective = '@auth(rules: [{allow: private}, {allow: private, provider: iam}])';

const getSchema = (authDirective: string): string => `
    type Post @model ${authDirective} {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
    }`;

const getSchemaWithFieldAuth = (authDirective: string): string => `
    type Post @model {
        id: ID
        title: String
        createdAt: String
        updatedAt: String
        protected: String ${authDirective}
    }`;

const getSchemaWithTypeAndFieldAuth = (typeAuthDirective: string, fieldAuthDirective: string): string => `
    type Post @model ${typeAuthDirective} {
        id: ID
        title: String
        createdAt: String
        updatedAt: String
        protected: String ${fieldAuthDirective}
    }`;

const getSchemaWithNonModelField = (authDirective: string): string => `
    type Post @model ${authDirective} {
        id: ID!
        title: String!
        location: Location
        status: Status
        createdAt: String
        updatedAt: String
    }

    type Location {
      name: String
      address: Address
    }

    type Address {
      street: String
      city: String
      state: String
      zip: String
    }

    enum Status {
      PUBLISHED,
      DRAFT
    }`;

const getSchemaWithRecursiveNonModelField = (authDirective: string): string => `
    type Post @model ${authDirective} {
      id: ID!
      title: String!
      tags: [Tag]
    }

    type Tag {
      id: ID
      tags: [Tag]
    }
  `;

const getRecursiveSchemaWithDiffModesOnParentType = (authDir1: string, authDir2: string): string => `
  type Post @model ${authDir1} {
    id: ID!
    title: String!
    tags: [Tag]
  }

  type Comment @model ${authDir2} {
    id: ID!
    content: String
    tags: [Tag]
  }

  type Tag {
    id: ID
    tags: [Tag]
  }
  `;

const getTransformer = (authConfig: AppSyncAuthConfiguration): GraphQLTransform => new GraphQLTransform({
  authConfig,
  transformers: [new ModelTransformer(), new AuthTransformer()],
  featureFlags,
});

const getObjectType = (
  doc: DocumentNode,
  type: string,
):
  ObjectTypeDefinitionNode
  | undefined => doc.definitions.find(def => def.kind === Kind.OBJECT_TYPE_DEFINITION && def.name.value === type) as
    | ObjectTypeDefinitionNode
    | undefined;

const expectNone = (fieldOrType): void => {
  expect(fieldOrType.directives.length).toEqual(0);
};

const expectOne = (fieldOrType, directiveName): void => {
  expect(fieldOrType.directives.length).toBe(1);
  expect(fieldOrType.directives.find(d => d.name.value === directiveName)).toBeDefined();
};

const expectTwo = (fieldOrType, directiveNames): void => {
  expect(directiveNames).toBeDefined();
  expect(directiveNames).toHaveLength(2);
  expect(fieldOrType.directives).toHaveLength(2);
  expect(fieldOrType.directives.find(d => d.name.value === directiveNames[0])).toBeDefined();
  expect(fieldOrType.directives.find(d => d.name.value === directiveNames[1])).toBeDefined();
};

const expectMultiple = (fieldOrType: ObjectTypeDefinitionNode | FieldDefinitionNode, directiveNames: string[]): void => {
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

const getField = (type, name): any => type.fields.find(f => f.name.value === name);

describe('validation tests', () => {
  const validationTest = (authDirective, authConfig, expectedError): void => {
    const schema = getSchema(authDirective);
    const transformer = getTransformer(authConfig);

    const t = (): void => {
      transformer.transform(schema);
    };

    expect(t).toThrowError(expectedError);
  };

  test('AMAZON_COGNITO_USER_POOLS not configured for project', () => {
    validationTest(
      privateAuthDirective,
      apiKeyDefaultConfig,
      "@auth directive with 'userPools' provider found, but the project has no Cognito User Pools authentication provider configured.",
    );
  });

  test('API_KEY not configured for project', () => {
    validationTest(
      publicAuthDirective,
      userPoolsDefaultConfig,
      "@auth directive with 'apiKey' provider found, but the project has no API Key authentication provider configured.",
    );
  });

  test('AWS_IAM not configured for project', () => {
    validationTest(
      publicIAMAuthDirective,
      userPoolsDefaultConfig,
      "@auth directive with 'iam' provider found, but the project has no IAM authentication provider configured.",
    );
  });

  test('OPENID_CONNECT not configured for project', () => {
    validationTest(
      ownerOpenIdAuthDirective,
      userPoolsDefaultConfig,
      "@auth directive with 'oidc' provider found, but the project has no OPENID_CONNECT authentication provider configured.",
    );
  });

  test("'group' cannot have provider", () => {
    validationTest(
      groupsWithProviderAuthDirective,
      userPoolsDefaultConfig,
      "@auth directive with 'groups' strategy only supports 'userPools' and 'oidc' providers, but found 'iam' assigned.",
    );
  });

  test("'owner' has invalid IAM provider", () => {
    validationTest(
      ownerWithIAMAuthDirective,
      userPoolsDefaultConfig,
      "@auth directive with 'owner' strategy only supports 'userPools' (default) and 'oidc' providers, but found 'iam' assigned.",
    );
  });

  test("'public' has invalid 'userPools' provider", () => {
    validationTest(
      publicUserPoolsAuthDirective,
      userPoolsDefaultConfig,
      "@auth directive with 'public' strategy only supports 'apiKey' (default) and 'iam' providers, but found 'userPools' assigned.",
    );
  });

  test("'private' has invalid 'apiKey' provider", () => {
    validationTest(
      privateWithApiKeyAuthDirective,
      userPoolsDefaultConfig,
      "@auth directive with 'private' strategy only supports 'userPools' (default) and 'iam' providers, but found 'apiKey' assigned.",
    );
  });
});

describe('schema generation directive tests', () => {
  const transformTest = (authDirective, authConfig, expectedDirectiveNames?: string[] | undefined): void => {
    const schema = getSchema(authDirective);
    const transformer = getTransformer(authConfig);

    const out = transformer.transform(schema);

    const schemaDoc = parse(out.schema);

    const postType = getObjectType(schemaDoc, 'Post');

    if (expectedDirectiveNames && expectedDirectiveNames.length > 0) {
      let expectedDirectiveNameCount = 0;

      expectedDirectiveNames.forEach(expectedDirectiveName => {
        expect(postType.directives.find(d => d.name.value === expectedDirectiveName)).toBeDefined();
        expectedDirectiveNameCount += 1;
      });

      expect(expectedDirectiveNameCount).toEqual(postType.directives.length);
    }
  };

  test('When provider is the same as default, then no directive added', () => {
    transformTest(ownerAuthDirective, userPoolsDefaultConfig);
  });

  test('When all providers are configured all of them are added', () => {
    const authConfig = withAuthModes(apiKeyDefaultConfig, ['AMAZON_COGNITO_USER_POOLS', 'AWS_IAM', 'OPENID_CONNECT']);

    (authConfig.additionalAuthenticationProviders[2] as AppSyncAuthConfigurationOIDCEntry).openIDConnectConfig = {
      name: 'Test Provider',
      issuerUrl: 'https://abc.def/',
    };

    transformTest(multiAuthDirective, authConfig, [userPoolsDirectiveName, iamDirectiveName, openIdDirectiveName, apiKeyDirectiveName]);
  });

  test('Operation fields are getting the directive added, when type has the @auth for all operations', () => {
    const schema = getSchema(ownerAuthDirective);
    const transformer = getTransformer(withAuthModes(apiKeyDefaultConfig, ['AMAZON_COGNITO_USER_POOLS']));

    const out = transformer.transform(schema);
    const schemaDoc = parse(out.schema);
    const queryType = getObjectType(schemaDoc, 'Query');
    const mutationType = getObjectType(schemaDoc, 'Mutation');
    const subscriptionType = getObjectType(schemaDoc, 'Subscription');

    const fields = [...queryType.fields, ...mutationType.fields];

    fields.forEach(field => {
      expect(field.directives.length).toEqual(1);
      expect(field.directives.find(d => d.name.value === userPoolsDirectiveName)).toBeDefined();
    });

    // Check that owner is required when only using owner auth rules
    subscriptionType.fields.forEach(field => {
      expect(field.arguments).toHaveLength(1);
      const arg: InputValueDefinitionNode = field.arguments[0];
      expect(arg.name.value).toEqual('owner');
      expect(arg.type.kind).toEqual(Kind.NAMED_TYPE);
    });

    // Check that resolvers containing the authMode check block
    const authStepSnippet = '## [Start] Authorization Steps. **';

    expect(out.resolvers['Query.getPost.auth.1.req.vtl']).toContain(authStepSnippet);
    expect(out.resolvers['Query.listPosts.auth.1.req.vtl']).toContain(authStepSnippet);
    expect(out.resolvers['Mutation.createPost.auth.1.req.vtl']).toContain(authStepSnippet);
    expect(out.resolvers['Mutation.createPost.auth.1.req.vtl']).toContain(authStepSnippet);
    expect(out.resolvers['Mutation.updatePost.auth.1.res.vtl']).toContain(authStepSnippet);
    expect(out.resolvers['Mutation.deletePost.auth.1.res.vtl']).toContain(authStepSnippet);
  });

  test('Operation fields are getting the directive added, when type has the @auth only for allowed operations', () => {
    const schema = getSchema(ownerRestrictedPublicAuthDirective);
    const transformer = getTransformer(withAuthModes(apiKeyDefaultConfig, ['AMAZON_COGNITO_USER_POOLS']));

    const out = transformer.transform(schema);
    const schemaDoc = parse(out.schema);
    const queryType = getObjectType(schemaDoc, 'Query');
    const mutationType = getObjectType(schemaDoc, 'Mutation');
    const subscriptionType = getObjectType(schemaDoc, 'Subscription');

    expectTwo(getField(queryType, 'getPost'), ['aws_cognito_user_pools', 'aws_api_key']);
    expectTwo(getField(queryType, 'listPosts'), ['aws_cognito_user_pools', 'aws_api_key']);

    expectOne(getField(mutationType, 'createPost'), 'aws_cognito_user_pools');
    expectOne(getField(mutationType, 'updatePost'), 'aws_cognito_user_pools');
    expectOne(getField(mutationType, 'deletePost'), 'aws_cognito_user_pools');

    const onCreate = getField(subscriptionType, 'onCreatePost');
    expectMultiple(onCreate, ['aws_subscribe', 'aws_api_key', 'aws_cognito_user_pools']);
    expectMultiple(getField(subscriptionType, 'onUpdatePost'), ['aws_subscribe', 'aws_api_key', 'aws_cognito_user_pools']);
    expectMultiple(getField(subscriptionType, 'onDeletePost'), ['aws_subscribe', 'aws_api_key', 'aws_cognito_user_pools']);
    expect(onCreate.arguments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: expect.objectContaining({ value: 'owner' }),
          type: expect.objectContaining({ kind: 'NamedType' }),
        }),
      ]),
    );
  });

  test('Field level @auth is propagated to type and the type related operations', () => {
    const schema = getSchemaWithFieldAuth(ownerRestrictedPublicAuthDirective);
    const transformer = getTransformer(withAuthModes(apiKeyDefaultConfig, ['AMAZON_COGNITO_USER_POOLS']));

    const out = transformer.transform(schema);
    const schemaDoc = parse(out.schema);
    const queryType = getObjectType(schemaDoc, 'Query');
    const mutationType = getObjectType(schemaDoc, 'Mutation');

    expectTwo(getField(queryType, 'getPost'), ['aws_cognito_user_pools', 'aws_api_key']);
    expectTwo(getField(queryType, 'listPosts'), ['aws_cognito_user_pools', 'aws_api_key']);

    expectOne(getField(mutationType, 'createPost'), 'aws_cognito_user_pools');
    expectOne(getField(mutationType, 'updatePost'), 'aws_cognito_user_pools');
    // since there is only one field allowed on delete it does not have access to delete
    expectNone(getField(mutationType, 'deletePost'));

    // Check that resolvers containing the authMode check block
    const authModeCheckSnippet = '## [Start] Field Authorization Steps. **';
    // resolvers to check is all other resolvers other than protected
    expect(out.resolvers['Post.id.req.vtl']).toContain(authModeCheckSnippet);
    expect(out.resolvers['Post.title.req.vtl']).toContain(authModeCheckSnippet);
    expect(out.resolvers['Post.createdAt.req.vtl']).toContain(authModeCheckSnippet);
    expect(out.resolvers['Post.updatedAt.req.vtl']).toContain(authModeCheckSnippet);
  });

  test("'groups' @auth at field level is propagated to type and the type related operations", () => {
    const schema = getSchemaWithFieldAuth(groupsAuthDirective);
    const transformer = getTransformer(withAuthModes(apiKeyDefaultConfig, ['AMAZON_COGNITO_USER_POOLS']));

    const out = transformer.transform(schema);
    const schemaDoc = parse(out.schema);
    const queryType = getObjectType(schemaDoc, 'Query');
    const mutationType = getObjectType(schemaDoc, 'Mutation');

    expectOne(getField(queryType, 'getPost'), 'aws_cognito_user_pools');
    expectOne(getField(queryType, 'listPosts'), 'aws_cognito_user_pools');

    expectOne(getField(mutationType, 'createPost'), 'aws_cognito_user_pools');
    expectOne(getField(mutationType, 'updatePost'), 'aws_cognito_user_pools');
    // since there is only one field allowed on delete it does not have access to delete
    expectNone(getField(mutationType, 'deletePost'));

    // Check that resolvers containing the authMode check block
    const authModeCheckSnippet = '## [Start] Field Authorization Steps. **';

    // resolvers to check is all other resolvers other than protected
    expect(out.resolvers['Post.id.req.vtl']).toContain(authModeCheckSnippet);
    expect(out.resolvers['Post.title.req.vtl']).toContain(authModeCheckSnippet);
    expect(out.resolvers['Post.createdAt.req.vtl']).toContain(authModeCheckSnippet);
    expect(out.resolvers['Post.updatedAt.req.vtl']).toContain(authModeCheckSnippet);
  });

  test("'groups' @auth at field level is propagated to type and the type related operations, also default provider for read", () => {
    const schema = getSchemaWithTypeAndFieldAuth(groupsAuthDirective, groupsWithApiKeyAuthDirective);
    const transformer = getTransformer(withAuthModes(apiKeyDefaultConfig, ['AMAZON_COGNITO_USER_POOLS']));

    const out = transformer.transform(schema);
    const schemaDoc = parse(out.schema);
    const queryType = getObjectType(schemaDoc, 'Query');
    const mutationType = getObjectType(schemaDoc, 'Mutation');

    expectTwo(getField(queryType, 'getPost'), ['aws_cognito_user_pools', 'aws_api_key']);
    expectTwo(getField(queryType, 'listPosts'), ['aws_cognito_user_pools', 'aws_api_key']);

    expectOne(getField(mutationType, 'createPost'), 'aws_cognito_user_pools');
    expectOne(getField(mutationType, 'updatePost'), 'aws_cognito_user_pools');
    expectOne(getField(mutationType, 'deletePost'), 'aws_cognito_user_pools');

    // Check that resolvers containing the authMode group check
    const groupCheckSnippet = '#set( $staticGroupRoles = [{"claim":"cognito:groups","entity":"admin"}] )';

    // resolvers to check is all other resolvers other than protected by the group rule
    expect(out.resolvers['Post.id.req.vtl']).toContain(groupCheckSnippet);
    expect(out.resolvers['Post.title.req.vtl']).toContain(groupCheckSnippet);
    expect(out.resolvers['Post.createdAt.req.vtl']).toContain(groupCheckSnippet);
    expect(out.resolvers['Post.updatedAt.req.vtl']).toContain(groupCheckSnippet);
  });

  test('Nested types without @model not getting directives applied for iam, and no policy is generated', () => {
    const schema = getSchemaWithNonModelField('');
    const transformer = getTransformer(withAuthModes(iamDefaultConfig, ['AMAZON_COGNITO_USER_POOLS']));

    const out = transformer.transform(schema);
    const schemaDoc = parse(out.schema);

    const locationType = getObjectType(schemaDoc, 'Location');
    const addressType = getObjectType(schemaDoc, 'Address');

    expect(locationType.directives.length).toBe(0);
    expect(addressType.directives.length).toBe(0);

    const authPolicyIdx = Object.keys(out.rootStack.Resources).find(r => r.includes('AuthRolePolicy'));

    expect(out.rootStack.Resources[authPolicyIdx]).toBeUndefined();
  });

  test('Nested types without @model not getting directives applied for iam, but policy is generated', () => {
    const schema = getSchemaWithNonModelField(privateIAMDirective);
    const transformer = getTransformer(withAuthModes(iamDefaultConfig, ['AMAZON_COGNITO_USER_POOLS']));

    const out = transformer.transform(schema);
    const schemaDoc = parse(out.schema);

    const locationType = getObjectType(schemaDoc, 'Location');
    const addressType = getObjectType(schemaDoc, 'Address');

    expect(locationType.directives.length).toBe(0);
    expect(addressType.directives.length).toBe(0);

    // find the key to account for the hash
    const authPolicyIdx = Object.keys(out.rootStack.Resources).find(r => r.includes('AuthRolePolicy01'));
    expect(out.rootStack.Resources[authPolicyIdx]).toBeDefined();
    const authRolePolicy = out.rootStack.Resources[authPolicyIdx];

    const locationPolicy = authRolePolicy.Properties.PolicyDocument.Statement[0].Resource.filter(
      r => r['Fn::Sub']
        && r['Fn::Sub'].length
        && r['Fn::Sub'].length === 2
        && r['Fn::Sub'][1].typeName
        && r['Fn::Sub'][1].typeName === 'Location',
    );
    expect(locationPolicy).toHaveLength(1);

    const addressPolicy = authRolePolicy.Properties.PolicyDocument.Statement[0].Resource.filter(
      r => r['Fn::Sub']
        && r['Fn::Sub'].length
        && r['Fn::Sub'].length === 2
        && r['Fn::Sub'][1].typeName
        && r['Fn::Sub'][1].typeName === 'Address',
    );
    expect(addressPolicy).toHaveLength(1);
  });

  test('Recursive types with diff auth modes on parent @model types', () => {
    const schema = getRecursiveSchemaWithDiffModesOnParentType(ownerAuthDirective, privateIAMDirective);
    const transformer = getTransformer(withAuthModes(userPoolsDefaultConfig, ['AWS_IAM']));

    const out = transformer.transform(schema);
    const schemaDoc = parse(out.schema);

    const tagType = getObjectType(schemaDoc, 'Tag');
    const expectedDirectiveNames = [userPoolsDirectiveName, iamDirectiveName];

    expectMultiple(tagType, expectedDirectiveNames);
  });

  test('Recursive types without @model', () => {
    const schema = getSchemaWithRecursiveNonModelField(ownerRestrictedIAMPrivateAuthDirective);
    const transformer = getTransformer(withAuthModes(userPoolsDefaultConfig, ['AWS_IAM']));

    const out = transformer.transform(schema);
    const schemaDoc = parse(out.schema);

    const tagType = getObjectType(schemaDoc, 'Tag');
    const expectedDirectiveNames = [userPoolsDirectiveName, iamDirectiveName];

    expectMultiple(tagType, expectedDirectiveNames);
  });

  test('OIDC works with private', () => {
    const cognitoUserPoolAndOidcAuthRules = '@auth(rules: [ { allow: private, provider: oidc, operations: [read] } { allow: owner, ownerField: "editors" } { allow: groups, groupsField: "groups"} ])';
    const authConfig = withAuthModes(apiKeyDefaultConfig, ['AMAZON_COGNITO_USER_POOLS', 'OPENID_CONNECT']);

    (authConfig.additionalAuthenticationProviders[1] as AppSyncAuthConfigurationOIDCEntry).openIDConnectConfig = {
      name: 'Test Provider',
      issuerUrl: 'https://abc.def/',
    };
    transformTest(cognitoUserPoolAndOidcAuthRules, authConfig, [userPoolsDirectiveName, openIdDirectiveName]);
  });

  test('Nested types without @model getting directives applied (cognito default, api key additional)', () => {
    const schema = getSchemaWithNonModelField(privateAndPublicDirective);
    const transformer = getTransformer(withAuthModes(userPoolsDefaultConfig, ['API_KEY']));

    const out = transformer.transform(schema);
    const schemaDoc = parse(out.schema);

    const locationType = getObjectType(schemaDoc, 'Location');
    const addressType = getObjectType(schemaDoc, 'Address');
    const expectedDirectiveNames = [userPoolsDirectiveName, apiKeyDirectiveName] || [];

    let expectedDirectiveNameCount = 0;

    expectedDirectiveNames.forEach(expectedDirectiveName => {
      expect(locationType.directives.find(d => d.name.value === expectedDirectiveName)).toBeDefined();
      expectedDirectiveNameCount += 1;
    });

    expect(expectedDirectiveNameCount).toEqual(locationType.directives.length);

    expectedDirectiveNameCount = 0;

    expectedDirectiveNames.forEach(expectedDirectiveName => {
      expect(addressType.directives.find(d => d.name.value === expectedDirectiveName)).toBeDefined();
      expectedDirectiveNameCount += 1;
    });

    expect(expectedDirectiveNameCount).toEqual(addressType.directives.length);
  });
});

describe('iam checks', () => {
  const identityPoolId = 'us-fake-1:abc';
  const adminRoles = ['helloWorldFunction', 'echoMessageFunction'];

  test('identity pool check gets added when using private rule', () => {
    const schema = getSchema(privateIAMDirective);
    const transformer = new GraphQLTransform({
      authConfig: iamDefaultConfig,
      transformers: [new ModelTransformer(), new AuthTransformer({ identityPoolId })],
      featureFlags,
    });
    const out = transformer.transform(schema);
    expect(out).toBeDefined();
    const createResolver = out.resolvers['Mutation.createPost.auth.1.req.vtl'];
    expect(createResolver).toContain(
      `#if( ($ctx.identity.userArn == $ctx.stash.authRole) || ($ctx.identity.cognitoIdentityPoolId == "${identityPoolId}" && $ctx.identity.cognitoIdentityAuthType == "authenticated") )`,
    );
    const queryResolver = out.resolvers['Query.listPosts.auth.1.req.vtl'];
    expect(queryResolver).toContain(
      `#if( ($ctx.identity.userArn == $ctx.stash.authRole) || ($ctx.identity.cognitoIdentityPoolId == "${identityPoolId}" && $ctx.identity.cognitoIdentityAuthType == "authenticated") )`,
    );
  });

  test('identity pool check does not get added when using public rule', () => {
    const schema = getSchema(publicIAMAuthDirective);
    const transformer = new GraphQLTransform({
      authConfig: iamDefaultConfig,
      transformers: [new ModelTransformer(), new AuthTransformer({ identityPoolId })],
      featureFlags,
    });
    const out = transformer.transform(schema);
    expect(out).toBeDefined();
    const createResolver = out.resolvers['Mutation.createPost.auth.1.req.vtl'];
    expect(createResolver).toContain('#if( $ctx.identity.userArn == $ctx.stash.unauthRole )');
    const queryResolver = out.resolvers['Query.listPosts.auth.1.req.vtl'];
    expect(queryResolver).toContain('#if( $ctx.identity.userArn == $ctx.stash.unauthRole )');
  });

  test('that admin roles are added when functions have access to the graphql api', () => {
    const schema = getSchema(privateIAMDirective);
    const transformer = new GraphQLTransform({
      authConfig: iamDefaultConfig,
      transformers: [new ModelTransformer(), new AuthTransformer({ adminRoles })],
      featureFlags,
    });
    const out = transformer.transform(schema);
    expect(out).toBeDefined();
    const createResolver = out.resolvers['Mutation.createPost.auth.1.req.vtl'];
    expect(createResolver).toContain('#set( $adminRoles = ["helloWorldFunction","echoMessageFunction"] )');
    expect(createResolver).toMatchSnapshot();
  });
});
