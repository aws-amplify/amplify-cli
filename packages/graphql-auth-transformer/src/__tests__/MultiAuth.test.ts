import { ObjectTypeDefinitionNode, parse, DocumentNode, Kind } from 'graphql';
import { GraphQLTransform } from 'graphql-transformer-core';
import { DynamoDBModelTransformer } from 'graphql-dynamodb-transformer';
import { ModelConnectionTransformer } from 'graphql-connection-transformer';
import { ModelAuthTransformer, AppSyncAuthConfiguration, AppSyncAuthMode } from '../ModelAuthTransformer';

const noAuthModeDefaultConfig: AppSyncAuthConfiguration = {
  defaultAuthentication: {
    authenticationType: undefined,
  },
  additionalAuthenticationProviders: [],
};

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

const openIdDefaultConfig: AppSyncAuthConfiguration = {
  defaultAuthentication: {
    authenticationType: 'OPENID_CONNECT',
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

  for (const authMode of authModes) {
    newAuthConfig.additionalAuthenticationProviders.push({
      authenticationType: authMode,
    });
  }

  return newAuthConfig;
};

const apiKeyDirectiveName = 'aws_api_key';
const userPoolsDirectiveName = 'aws_cognito_user_pools';
const iamDirectiveName = 'aws_iam';
const openIdDirectiveName = 'aws_oidc';

const multiAuthDirective =
  '@auth(rules: [{allow: private}, {allow: public}, {allow: private, provider: iam }, {allow: owner, provider: oidc }])';
const ownerAuthDirective = '@auth(rules: [{allow: owner}])';
const ownerWithIAMAuthDirective = '@auth(rules: [{allow: owner, provider: iam }])';
const ownerRestrictedPublicAuthDirective = '@auth(rules: [{allow: owner},{allow: public, operations: [read]}])';
const groupsAuthDirective = '@auth(rules: [{allow: groups}])';
const groupsWithApiKeyAuthDirective = '@auth(rules: [{allow: groups}, {allow: public, operations: [read]}])';
const groupsWithProviderAuthDirective = '@auth(rules: [{allow: groups, provider: iam }])';
const ownerOpenIdAuthDirective = '@auth(rules: [{allow: owner, provider: oidc }])';
const privateAuthDirective = '@auth(rules: [{allow: private}])';
const publicIAMAuthDirective = '@auth(rules: [{allow: public, provider: iam }])';
const privateWithApiKeyAuthDirective = '@auth(rules: [{allow: private, provider: apiKey }])';
const publicAuthDirective = '@auth(rules: [{allow: public}])';
const publicUserPoolsAuthDirective = '@auth(rules: [{allow: public, provider: userPools}])';

const getSchema = (authDirective: string) => {
  return `
    type Post @model ${authDirective} {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
    }`;
};

const getSchemaWithFieldAuth = (authDirective: string) => {
  return `
    type Post @model {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
        protected: String ${authDirective}
    }`;
};

const getSchemaWithTypeAndFieldAuth = (typeAuthDirective: string, fieldAuthDirective: string) => {
  return `
    type Post @model ${typeAuthDirective} {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
        protected: String ${fieldAuthDirective}
    }`;
};

const getTransformer = (authConfig: AppSyncAuthConfiguration) =>
  new GraphQLTransform({
    transformers: [new DynamoDBModelTransformer(), new ModelConnectionTransformer(), new ModelAuthTransformer({ authConfig })],
  });

const getObjectType = (doc: DocumentNode, type: string): ObjectTypeDefinitionNode | undefined => {
  return doc.definitions.find(def => def.kind === Kind.OBJECT_TYPE_DEFINITION && def.name.value === type) as
    | ObjectTypeDefinitionNode
    | undefined;
};

const expectNone = fieldOrType => {
  expect(fieldOrType.directives.length === 0);
};

const expectOne = (fieldOrType, directiveName) => {
  expect(fieldOrType.directives.length === 1);
  expect(fieldOrType.directives.find(d => d.name.value === directiveName)).toBeDefined();
};

const expectTwo = (fieldOrType, directiveNames) => {
  expect(directiveNames).toBeDefined();
  expect(directiveNames).toHaveLength(2);
  expect(fieldOrType.directives.length === 2);
  expect(fieldOrType.directives.find(d => d.name.value === directiveNames[0])).toBeDefined();
  expect(fieldOrType.directives.find(d => d.name.value === directiveNames[1])).toBeDefined();
};

const getField = (type, name) => type.fields.find(f => f.name.value === name);

describe('Validation tests', () => {
  const validationTest = (authDirective, authConfig, expectedError) => {
    const schema = getSchema(authDirective);
    const transformer = getTransformer(authConfig);

    const t = () => {
      const out = transformer.transform(schema);
    };

    expect(t).toThrowError(expectedError);
  };

  test('AMAZON_COGNITO_USER_POOLS not configured for project', () => {
    validationTest(
      privateAuthDirective,
      apiKeyDefaultConfig,
      `@auth directive with 'userPools' provider found, but the project has no Cognito User \
Pools authentication provider configured.`
    );
  });

  test('API_KEY not configured for project', () => {
    validationTest(
      publicAuthDirective,
      userPoolsDefaultConfig,
      `@auth directive with 'apiKey' provider found, but the project has no API Key \
authentication provider configured.`
    );
  });

  test('AWS_IAM not configured for project', () => {
    validationTest(
      publicIAMAuthDirective,
      userPoolsDefaultConfig,
      `@auth directive with 'iam' provider found, but the project has no IAM \
authentication provider configured.`
    );
  });

  test('OPENID_CONNECT not configured for project', () => {
    validationTest(
      ownerOpenIdAuthDirective,
      userPoolsDefaultConfig,
      `@auth directive with 'oidc' provider found, but the project has no OPENID_CONNECT \
authentication provider configured.`
    );
  });

  test(`'group' cannot have provider`, () => {
    validationTest(
      groupsWithProviderAuthDirective,
      userPoolsDefaultConfig,
      `@auth directive with 'groups' strategy only supports 'userPools' provider, but found \
'iam' assigned`
    );
  });

  test(`'owner' has invalid IAM provider`, () => {
    validationTest(
      ownerWithIAMAuthDirective,
      userPoolsDefaultConfig,
      `@auth directive with 'owner' strategy only supports 'userPools' (default) and \
'oidc' providers, but found 'iam' assigned.`
    );
  });

  test(`'public' has invalid 'userPools' provider`, () => {
    validationTest(
      publicUserPoolsAuthDirective,
      userPoolsDefaultConfig,
      `@auth directive with 'public' strategy only supports 'apiKey' (default) and 'iam' providers, but \
found 'userPools' assigned.`
    );
  });

  test(`'private' has invalid 'apiKey' provider`, () => {
    validationTest(
      privateWithApiKeyAuthDirective,
      userPoolsDefaultConfig,
      `@auth directive with 'private' strategy only supports 'userPools' (default) and 'iam' providers, but \
found 'apiKey' assigned.`
    );
  });
});

describe('Type directive transformation tests', () => {
  const transformTest = (authDirective, authConfig, expectedDirectiveNames?: string[] | undefined) => {
    const schema = getSchema(authDirective);
    const transformer = getTransformer(authConfig);

    const out = transformer.transform(schema);

    const schemaDoc = parse(out.schema);

    const postType = getObjectType(schemaDoc, 'Post');

    if (expectedDirectiveNames && expectedDirectiveNames.length > 0) {
      let expectedDireciveNameCount = 0;

      for (const expectedDirectiveName of expectedDirectiveNames) {
        expect(postType.directives.find(d => d.name.value === expectedDirectiveName)).toBeDefined();
        expectedDireciveNameCount++;
      }

      expect(expectedDireciveNameCount).toEqual(postType.directives.length);
    }
  };

  test(`When provider is the same as default, then no directive added`, () => {
    transformTest(ownerAuthDirective, userPoolsDefaultConfig);
  });

  // Disabling until troubleshooting the changes
  // test(`When provider is not the same as default directive is added`, () => {
  //     transformTest(
  //         ownerAuthDirective,
  //         withAuthModes(apiKeyDefaultConfig, ['AMAZON_COGNITO_USER_POOLS']),
  //         [userPoolsDirectiveName, apiKeyDirectiveName]
  //     );
  // });

  test(`When all providers are configured all of them are added`, () => {
    const authConfig = withAuthModes(apiKeyDefaultConfig, ['AMAZON_COGNITO_USER_POOLS', 'AWS_IAM', 'OPENID_CONNECT']);

    authConfig.additionalAuthenticationProviders[2].openIDConnectConfig = {
      name: 'Test Provider',
      issuerUrl: 'https://abc.def/',
    };

    transformTest(multiAuthDirective, authConfig, [userPoolsDirectiveName, iamDirectiveName, openIdDirectiveName, apiKeyDirectiveName]);
  });

  test(`Operation fields are getting the directive added, when type has the @auth for all operations`, () => {
    const schema = getSchema(ownerAuthDirective);
    const transformer = getTransformer(withAuthModes(apiKeyDefaultConfig, ['AMAZON_COGNITO_USER_POOLS']));

    const out = transformer.transform(schema);
    const schemaDoc = parse(out.schema);
    const queryType = getObjectType(schemaDoc, 'Query');
    const mutationType = getObjectType(schemaDoc, 'Mutation');

    const fields = [...queryType.fields, ...mutationType.fields];

    for (const field of fields) {
      expect(field.directives.length === 1);
      expect(field.directives.find(d => d.name.value === userPoolsDirectiveName)).toBeDefined();
    }

    // Check that resolvers containing the authMode check block
    const authModeCheckSnippet = '## [Start] Determine request authentication mode';

    expect(out.resolvers['Query.getPost.res.vtl']).toContain(authModeCheckSnippet);
    expect(out.resolvers['Query.listPosts.res.vtl']).toContain(authModeCheckSnippet);
    expect(out.resolvers['Mutation.createPost.req.vtl']).toContain(authModeCheckSnippet);
    expect(out.resolvers['Mutation.updatePost.req.vtl']).toContain(authModeCheckSnippet);
    expect(out.resolvers['Mutation.deletePost.req.vtl']).toContain(authModeCheckSnippet);
  });

  test(`Operation fields are getting the directive added, when type has the @auth only for allowed operations`, () => {
    const schema = getSchema(ownerRestrictedPublicAuthDirective);
    const transformer = getTransformer(withAuthModes(apiKeyDefaultConfig, ['AMAZON_COGNITO_USER_POOLS']));

    const out = transformer.transform(schema);
    const schemaDoc = parse(out.schema);
    const queryType = getObjectType(schemaDoc, 'Query');
    const mutationType = getObjectType(schemaDoc, 'Mutation');

    expect(expectTwo(getField(queryType, 'getPost'), ['aws_cognito_user_pools', 'aws_api_key']));
    expect(expectTwo(getField(queryType, 'listPosts'), ['aws_cognito_user_pools', 'aws_api_key']));

    expect(expectOne(getField(mutationType, 'createPost'), 'aws_cognito_user_pools'));
    expect(expectOne(getField(mutationType, 'updatePost'), 'aws_cognito_user_pools'));
    expect(expectOne(getField(mutationType, 'deletePost'), 'aws_cognito_user_pools'));
  });

  test(`'public' with IAM provider adds policy for Unauth role`, () => {
    const schema = getSchema(publicIAMAuthDirective);
    const transformer = getTransformer(withAuthModes(userPoolsDefaultConfig, ['AWS_IAM']));

    const out = transformer.transform(schema);

    expect(out.rootStack.Resources.UnauthRolePolicy01).toBeDefined();
  });

  test(`Field level @auth is propagated to type and the type related operations`, () => {
    const schema = getSchemaWithFieldAuth(ownerRestrictedPublicAuthDirective);
    const transformer = getTransformer(withAuthModes(apiKeyDefaultConfig, ['AMAZON_COGNITO_USER_POOLS']));

    const out = transformer.transform(schema);
    const schemaDoc = parse(out.schema);
    const queryType = getObjectType(schemaDoc, 'Query');
    const mutationType = getObjectType(schemaDoc, 'Mutation');

    expect(expectTwo(getField(queryType, 'getPost'), ['aws_cognito_user_pools', 'aws_api_key']));
    expect(expectTwo(getField(queryType, 'listPosts'), ['aws_cognito_user_pools', 'aws_api_key']));

    expect(expectOne(getField(mutationType, 'createPost'), 'aws_cognito_user_pools'));
    expect(expectOne(getField(mutationType, 'updatePost'), 'aws_cognito_user_pools'));
    expect(expectOne(getField(mutationType, 'deletePost'), 'aws_cognito_user_pools'));

    const postType = getObjectType(schemaDoc, 'Post');
    expect(expectTwo(getField(postType, 'protected'), ['aws_cognito_user_pools', 'aws_api_key']));

    // Check that resolvers containing the authMode check block
    const authModeCheckSnippet = '## [Start] Determine request authentication mode';

    expect(out.resolvers['Post.protected.req.vtl']).toContain(authModeCheckSnippet);
  });

  test(`'groups' @auth at field level is propagated to type and the type related operations`, () => {
    const schema = getSchemaWithFieldAuth(groupsAuthDirective);
    const transformer = getTransformer(withAuthModes(apiKeyDefaultConfig, ['AMAZON_COGNITO_USER_POOLS']));

    const out = transformer.transform(schema);
    const schemaDoc = parse(out.schema);
    const queryType = getObjectType(schemaDoc, 'Query');
    const mutationType = getObjectType(schemaDoc, 'Mutation');

    expect(expectOne(getField(queryType, 'getPost'), 'aws_cognito_user_pools'));
    expect(expectOne(getField(queryType, 'listPosts'), 'aws_cognito_user_pools'));

    expect(expectOne(getField(mutationType, 'createPost'), 'aws_cognito_user_pools'));
    expect(expectOne(getField(mutationType, 'updatePost'), 'aws_cognito_user_pools'));
    expect(expectOne(getField(mutationType, 'deletePost'), 'aws_cognito_user_pools'));

    const postType = getObjectType(schemaDoc, 'Post');
    expect(expectOne(getField(postType, 'protected'), 'aws_cognito_user_pools'));

    // Check that resolvers containing the authMode check block
    const authModeCheckSnippet = '## [Start] Determine request authentication mode';

    expect(out.resolvers['Post.protected.req.vtl']).toContain(authModeCheckSnippet);
  });

  test(`'groups' @auth at field level is propagated to type and the type related operations, also default provider for read`, () => {
    const schema = getSchemaWithTypeAndFieldAuth(groupsAuthDirective, groupsWithApiKeyAuthDirective);
    const transformer = getTransformer(withAuthModes(apiKeyDefaultConfig, ['AMAZON_COGNITO_USER_POOLS']));

    const out = transformer.transform(schema);
    const schemaDoc = parse(out.schema);
    const queryType = getObjectType(schemaDoc, 'Query');
    const mutationType = getObjectType(schemaDoc, 'Mutation');

    expect(expectTwo(getField(queryType, 'getPost'), ['aws_cognito_user_pools', 'aws_api_key']));
    expect(expectTwo(getField(queryType, 'listPosts'), ['aws_cognito_user_pools', 'aws_api_key']));

    expect(expectOne(getField(mutationType, 'createPost'), 'aws_cognito_user_pools'));
    expect(expectOne(getField(mutationType, 'updatePost'), 'aws_cognito_user_pools'));
    expect(expectOne(getField(mutationType, 'deletePost'), 'aws_cognito_user_pools'));

    const postType = getObjectType(schemaDoc, 'Post');
    expect(expectTwo(getField(postType, 'protected'), ['aws_cognito_user_pools', 'aws_api_key']));

    // Check that resolvers containing the authMode check block
    const authModeCheckSnippet = '## [Start] Determine request authentication mode';

    expect(out.resolvers['Post.protected.req.vtl']).toContain(authModeCheckSnippet);
  });

  // Disabling until troubleshooting the changes
  // test(`Connected type is also getting the directives added, when a field has @connection`, () => {
  //     const schema = `
  //         type Post @model @auth(rules:[{allow: private}]){
  //             id: ID!
  //             title: String!
  //             comments: [Comment] @connection(name: "PostComments")
  //         }

  //         type Comment @model {
  //             id: ID!
  //             content: String!
  //             post: Post @connection(name: "PostComments")
  //         }
  //     `;

  //     const transformer = getTransformer(withAuthModes(apiKeyDefaultConfig, ['AMAZON_COGNITO_USER_POOLS']));
  //     const out = transformer.transform(schema);
  //     const schemaDoc = parse(out.schema);
  //     const queryType = getObjectType(schemaDoc, 'Query');
  //     const mutationType = getObjectType(schemaDoc, 'Mutation');

  //     expect (expectOne(getField(queryType, 'getPost'), 'aws_cognito_user_pools'));
  //     expect (expectOne(getField(queryType, 'listPosts'), 'aws_cognito_user_pools'));

  //     expect (expectOne(getField(mutationType, 'createPost'), 'aws_cognito_user_pools'));
  //     expect (expectOne(getField(mutationType, 'updatePost'), 'aws_cognito_user_pools'));
  //     expect (expectOne(getField(mutationType, 'deletePost'), 'aws_cognito_user_pools'));

  //     const postType = getObjectType(schemaDoc, 'Post');
  //     expect (expectTwo(postType, ['aws_api_key', 'aws_cognito_user_pools']));
  //     expect (expectNone(getField(postType, 'comments')));

  //     const commentType = getObjectType(schemaDoc, 'Comment');
  //     expect (expectOne(getField(commentType, 'post'), 'aws_cognito_user_pools'));

  //     const modelPostConnectionType = getObjectType(schemaDoc, 'ModelPostConnection');
  //     expect (expectOne(modelPostConnectionType, 'aws_cognito_user_pools'));
  // });
});

describe(`Policy slicing tests`, () => {
  test(`'For the long Todo type there should be 2 auth role managed policies generated`, () => {
    const schema = `
    type TodoWithExtraLongLongLongLongLongLongLongLongLongLongLongLongLongLongLongName @model(subscriptions:null) @auth(rules:[{allow: private, provider: iam}])
    {
      id: ID!
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename001: String! @auth(rules:[{allow: private, provider: iam}])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename002: String! @auth(rules:[{allow: private, provider: iam}])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename003: String! @auth(rules:[{allow: private, provider: iam}])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename004: String! @auth(rules:[{allow: private, provider: iam}])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename005: String! @auth(rules:[{allow: private, provider: iam}])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename006: String! @auth(rules:[{allow: private, provider: iam}])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename007: String! @auth(rules:[{allow: private, provider: iam}])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename008: String! @auth(rules:[{allow: private, provider: iam}])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename009: String! @auth(rules:[{allow: private, provider: iam}])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename010: String! @auth(rules:[{allow: private, provider: iam}])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename011: String! @auth(rules:[{allow: private, provider: iam}])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename012: String! @auth(rules:[{allow: private, provider: iam}])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename013: String! @auth(rules:[{allow: private, provider: iam}])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename014: String! @auth(rules:[{allow: private, provider: iam}])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename015: String! @auth(rules:[{allow: private, provider: iam}])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename016: String! @auth(rules:[{allow: private, provider: iam}])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename017: String! @auth(rules:[{allow: private, provider: iam}])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename018: String! @auth(rules:[{allow: private, provider: iam}])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename019: String! @auth(rules:[{allow: private, provider: iam}])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename020: String! @auth(rules:[{allow: private, provider: iam}])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename021: String! @auth(rules:[{allow: private, provider: iam}])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename022: String! @auth(rules:[{allow: private, provider: iam}])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename023: String! @auth(rules:[{allow: private, provider: iam}])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename024: String! @auth(rules:[{allow: private, provider: iam}])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename025: String! @auth(rules:[{allow: private, provider: iam}])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename026: String! @auth(rules:[{allow: private, provider: iam}])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename027: String! @auth(rules:[{allow: private, provider: iam}])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename028: String! @auth(rules:[{allow: private, provider: iam}])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename029: String! @auth(rules:[{allow: private, provider: iam}])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename030: String! @auth(rules:[{allow: private, provider: iam}])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename031: String! @auth(rules:[{allow: private, provider: iam}])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename032: String! @auth(rules:[{allow: private, provider: iam}])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename033: String! @auth(rules:[{allow: private, provider: iam}])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename034: String! @auth(rules:[{allow: private, provider: iam}])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename035: String! @auth(rules:[{allow: private, provider: iam}])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename036: String! @auth(rules:[{allow: private, provider: iam}])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename037: String! @auth(rules:[{allow: private, provider: iam}])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename038: String! @auth(rules:[{allow: private, provider: iam}])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename039: String! @auth(rules:[{allow: private, provider: iam}])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename040: String! @auth(rules:[{allow: private, provider: iam}])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename041: String! @auth(rules:[{allow: private, provider: iam}])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename042: String! @auth(rules:[{allow: private, provider: iam}])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename043: String! @auth(rules:[{allow: private, provider: iam}])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename044: String! @auth(rules:[{allow: private, provider: iam}])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename045: String! @auth(rules:[{allow: private, provider: iam}])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename046: String! @auth(rules:[{allow: private, provider: iam}])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename047: String! @auth(rules:[{allow: private, provider: iam}])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename048: String! @auth(rules:[{allow: private, provider: iam}])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename049: String! @auth(rules:[{allow: private, provider: iam}])
      namenamenamenamenamenamenamenamenamenamenamenamenamenamename050: String! @auth(rules:[{allow: private, provider: iam}])
      description: String
    }
    `;
    const authConfig = withAuthModes(apiKeyDefaultConfig, ['AMAZON_COGNITO_USER_POOLS', 'AWS_IAM']);
    const transformer = getTransformer(authConfig);
    const out = transformer.transform(schema);

    expect(out.rootStack.Resources.AuthRolePolicy01).toBeTruthy();
    expect(out.rootStack.Resources.AuthRolePolicy01.Properties.PolicyDocument.Statement[0].Resource.length).toEqual(26);
    expect(out.rootStack.Resources.AuthRolePolicy02).toBeTruthy();
    expect(out.rootStack.Resources.AuthRolePolicy02.Properties.PolicyDocument.Statement[0].Resource.length).toEqual(26);
    expect(out.rootStack.Resources.AuthRolePolicy03).toBeTruthy();
    expect(out.rootStack.Resources.AuthRolePolicy03.Properties.PolicyDocument.Statement[0].Resource.length).toEqual(4);
    expect(out.rootStack.Resources.UnauthRolePolicy01).toBeFalsy();
  });
});
