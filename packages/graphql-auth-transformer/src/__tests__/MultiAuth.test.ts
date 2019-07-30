import {
    ObjectTypeDefinitionNode, parse, FieldDefinitionNode, DocumentNode,
    DefinitionNode, Kind, InputObjectTypeDefinitionNode
} from 'graphql'
import GraphQLTransform, { InvalidDirectiveError } from 'graphql-transformer-core'
import { ResourceConstants } from 'graphql-transformer-common'
import { DynamoDBModelTransformer } from 'graphql-dynamodb-transformer'
import { ModelAuthTransformer, AppSyncAuthConfiguration, AppSyncAuthMode } from '../ModelAuthTransformer'

const noAuthModeDefaultConfig: AppSyncAuthConfiguration = {
    defaultAuthentication: {
        authenticationType: undefined
    },
    additionalAuthenticationProviders: []
};

const userPoolsDefaultConfig: AppSyncAuthConfiguration = {
    defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS'
    },
    additionalAuthenticationProviders: []
};

const apiKeyDefaultConfig: AppSyncAuthConfiguration = {
    defaultAuthentication: {
        authenticationType: 'API_KEY'
    },
    additionalAuthenticationProviders: []
};

const openIdDefaultConfig: AppSyncAuthConfiguration= {
    defaultAuthentication: {
        authenticationType: 'OPENID_CONNECT'
    },
    additionalAuthenticationProviders: []
};

const iamDefaultConfig: AppSyncAuthConfiguration = {
    defaultAuthentication: {
        authenticationType: 'AWS_IAM'
    },
    additionalAuthenticationProviders: []
};

const withAuthModes = (authConfig: AppSyncAuthConfiguration, authModes: AppSyncAuthMode[]): AppSyncAuthConfiguration => {
    const newAuthConfig = {
        defaultAuthentication: {
            authenticationType: authConfig.defaultAuthentication.authenticationType
        },
        additionalAuthenticationProviders: []
    }

    for (const authMode of authModes) {
        newAuthConfig.additionalAuthenticationProviders.push({
            authenticationType: authMode
        })
    }

    return newAuthConfig;
};

const userPoolsDirectiveName = 'aws_cognito_user_pools';
const iamDirectiveName = 'aws_iam';
const openIdDirectiveName = 'aws_oidc';


const multiAuthDirective = '@auth(rules: [{allow: private}, {allow: public}, {allow: private, provider: iam }, {allow: owner, provider: oidc }])';
const ownerAuthDirective = '@auth(rules: [{allow: owner}])';
const ownerWithIAMAuthDirective = '@auth(rules: [{allow: owner, provider: iam }])';
const groupsAuthDirective = '@auth(rules: [{allow: groups}])';
const groupsWithProviderAuthDirective = '@auth(rules: [{allow: groups, provider: iam }])';
const ownerOpenIdAuthDirective = '@auth(rules: [{allow: owner, provider: oidc }])';
const privateAuthDirective = '@auth(rules: [{allow: private}])';
const privateIAMAuthDirective = '@auth(rules: [{allow: private, provider: iam }])';
const privateWithApiKeyAuthDirective = '@auth(rules: [{allow: private, provider: apiKey }])';
const publicAuthDirective = '@auth(rules: [{allow: public}])';
const publicUserPoolsAuthDirective = '@auth(rules: [{allow: public, provider: userPools}])';

const getSchema = (authDirective: string) => {
    return `type Post @model ${authDirective} {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
    }`;
};

const getTransformer = (authConfig: AppSyncAuthConfiguration) =>
    new GraphQLTransform({
        transformers: [
            new DynamoDBModelTransformer(),
            new ModelAuthTransformer({ authConfig })
        ]
    });

const getObjectType = (doc: DocumentNode, type: string): ObjectTypeDefinitionNode | undefined => {
    return doc.definitions.find(
        (def) => def.kind === Kind.OBJECT_TYPE_DEFINITION && def.name.value === type
        ) as ObjectTypeDefinitionNode | undefined;
}

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
            privateIAMAuthDirective,
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
            `@auth directive with 'groups' strategy does not support providers, but found \
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
            `@auth directive with 'private' strategy only supports 'apiKey' (default) and 'iam' providers, but \
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
            for (const expectedDirectiveName of expectedDirectiveNames) {
                expect(postType.directives.find((d) => d.name.value === expectedDirectiveName)).toBeDefined();
            }
        }
    };

    test(`When provider is the same as default, then no directive added`, () => {
        transformTest(
            ownerAuthDirective,
            userPoolsDefaultConfig
        );
    });

    test(`When provider is not the same as default directive is added`, () => {
        transformTest(
            ownerAuthDirective,
            withAuthModes(apiKeyDefaultConfig, ['AMAZON_COGNITO_USER_POOLS']),
            [userPoolsDirectiveName]
        );
    });

    test(`When all providers are configured only 3 of them is added, the default is not`, () => {
        const authConfig = withAuthModes(apiKeyDefaultConfig, ['AMAZON_COGNITO_USER_POOLS', 'AWS_IAM', 'OPENID_CONNECT']);

        authConfig.additionalAuthenticationProviders[2].openIDConnectConfig = {
            name: 'Test Provider',
            issuerUrl: 'https://abc.def/'
        }

        transformTest(
            multiAuthDirective,
            authConfig,
            [userPoolsDirectiveName, iamDirectiveName, openIdDirectiveName]
        );
    });

    test(`Operation fields are getting the directive added, when type has the @auth`, () => {
        const schema = getSchema(ownerAuthDirective);
        const transformer = getTransformer(withAuthModes(apiKeyDefaultConfig, ['AMAZON_COGNITO_USER_POOLS']));

        const out = transformer.transform(schema);

        const schemaDoc = parse(out.schema);

        const queryType = getObjectType(schemaDoc, 'Query');
        const mutationType = getObjectType(schemaDoc, 'Mutation');

        const fields = [
            ...queryType.fields,
            ...mutationType.fields
        ];

        for (const field of fields) {
            expect(field.directives.length === 1);
            expect(field.directives.find((d) => d.name.value === userPoolsDirectiveName)).toBeDefined();
        }

        // Check that resolvers containing the authMode check block
        const authModeCheckSnippet = '## [Start] Determine request authentication mode';

        expect(out.resolvers['Query.getPost.res.vtl']).toContain(authModeCheckSnippet);
        expect(out.resolvers['Query.listPosts.res.vtl']).toContain(authModeCheckSnippet);
        expect(out.resolvers['Mutation.createPost.req.vtl']).toContain(authModeCheckSnippet);
        expect(out.resolvers['Mutation.updatePost.req.vtl']).toContain(authModeCheckSnippet);
        expect(out.resolvers['Mutation.deletePost.req.vtl']).toContain(authModeCheckSnippet);
    });

    test(`'private' with IAM provider adds policy for Unauth role`, () => {
        const schema = getSchema(privateIAMAuthDirective);
        const transformer = getTransformer(withAuthModes(userPoolsDefaultConfig, ['AWS_IAM']));

        const out = transformer.transform(schema);

        expect(
            out.rootStack.Resources[ResourceConstants.RESOURCES.UnauthRolePolicy]
        ).toBeDefined();
    });
});
