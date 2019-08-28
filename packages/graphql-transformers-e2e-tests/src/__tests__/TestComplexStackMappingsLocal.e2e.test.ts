import GraphQLTransform, { Transformer, InvalidDirectiveError } from 'graphql-transformer-core'
import ModelTransformer from 'graphql-dynamodb-transformer';
import ElasticsearchTransformer from 'graphql-elasticsearch-transformer';
import ConnectionTransformer from 'graphql-connection-transformer';
import HttpTransformer from 'graphql-http-transformer';
import AuthTransformer from 'graphql-auth-transformer';
import FunctionTransformer from 'graphql-function-transformer';
import Template from "cloudform-types/types/template";
import { parse, FieldDefinitionNode, ObjectTypeDefinitionNode,
    Kind, InputObjectTypeDefinitionNode } from 'graphql';
import { expectExactKeys, expectNonNullFields, expectNullableFields,
    expectNonNullInputValues, expectNullableInputValues, expectInputValueToHandle  } from '../testUtil';


const userType = `
type User @model @auth(rules: [{ allow: owner }]) {
    id: ID!
    name: String
    posts: [UserPost] @connection(name: "UserPostsUser")
    profpic: String @http(url: "https://www.profpic.org/this/is/a/fake/url")
}`;
const userPostType = `
type UserPost @model {
    id: ID!
    user: User @connection(name: "UserPostsUser")
    post: Post @connection(name: "UserPostsPost")
}
`;
const postType = `
type Post @model @searchable {
    id: ID!
    name: String
    authors: [UserPost] @connection(name: "UserPostsPost")
    score: Int @function(name: "scorefunc")
}
`;

/**
 * We test this schema with the same set of rules multiple times. This protects against a subtle bug in the stack mapping
 * that caused the order to impact the stack that a resource got mapped to.
 */
test('Test that every resource exists in the correct stack given a complex schema with overlapping names.', () => {
    const schema = [userType, userPostType, postType].join('\n');
    transpileAndCheck(schema);
})

test('Test that every resource exists in the correct stack given a complex schema with overlapping names. Rotation 1.', () => {
    const schema = [userPostType, postType, userType].join('\n');
    transpileAndCheck(schema);
})

test('Test that every resource exists in the correct stack given a complex schema with overlapping names. Rotation 2.', () => {
    const schema = [postType, userType, userPostType].join('\n');
    transpileAndCheck(schema);
})


function transpileAndCheck(schema: string) {
    const transformer = new GraphQLTransform({
        transformers: [
            new ModelTransformer(),
            new HttpTransformer(),
            new ElasticsearchTransformer(),
            new ConnectionTransformer(),
            new FunctionTransformer,
            new AuthTransformer(),
        ]
    });

    const out = transformer.transform(schema);

    // Check root
    expectExactKeys(
        out.rootStack.Resources,
        new Set([
            'GraphQLAPI', 'GraphQLAPIKey', 'GraphQLSchema', 'User', 'UserPost',
            'Post', 'ConnectionStack', 'SearchableStack', 'FunctionDirectiveStack',
            'HttpStack', 'NoneDataSource'
        ])
    );
    expectExactKeys(
        out.rootStack.Outputs,
        new Set(['GraphQLAPIIdOutput', 'GraphQLAPIEndpointOutput', 'GraphQLAPIKeyOutput'])
    );

    // Check User
    expectExactKeys(
        out.stacks.User.Resources,
        new Set([
            'UserTable', 'UserIAMRole', 'UserDataSource', 'GetUserResolver',
            'ListUserResolver', 'CreateUserResolver', 'UpdateUserResolver',
            'DeleteUserResolver', 'SubscriptiononCreateUserResolver', 'SubscriptiononDeleteUserResolver',
            'SubscriptiononUpdateUserResolver'
        ])
    );
    expectExactKeys(
        out.stacks.User.Outputs,
        new Set(['GetAttUserTableStreamArn', 'GetAttUserDataSourceName', 'GetAttUserTableName'])
    );

    // Check UserPost
    expectExactKeys(
        out.stacks.UserPost.Resources,
        new Set([
            'UserPostTable', 'UserPostIAMRole', 'UserPostDataSource', 'GetUserPostResolver',
            'ListUserPostResolver', 'CreateUserPostResolver', 'UpdateUserPostResolver',
            'DeleteUserPostResolver'
        ])
    );
    expectExactKeys(
        out.stacks.UserPost.Outputs,
        new Set(['GetAttUserPostTableStreamArn', 'GetAttUserPostDataSourceName', 'GetAttUserPostTableName'])
    );

    // Check Post
    expectExactKeys(
        out.stacks.Post.Resources,
        new Set([
            'PostTable', 'PostIAMRole', 'PostDataSource', 'GetPostResolver',
            'ListPostResolver', 'CreatePostResolver', 'UpdatePostResolver',
            'DeletePostResolver'
        ])
    );
    expectExactKeys(
        out.stacks.Post.Outputs,
        new Set(['GetAttPostTableStreamArn', 'GetAttPostDataSourceName', 'GetAttPostTableName'])
    );

    // Check SearchableStack
    expectExactKeys(
        out.stacks.SearchableStack.Resources,
        new Set([
            'ElasticSearchAccessIAMRole', 'ElasticSearchDataSource', 'ElasticSearchDomain', 'ElasticSearchStreamingLambdaIAMRole',
            'ElasticSearchStreamingLambdaFunction', 'SearchablePostLambdaMapping', 'SearchPostResolver'
        ])
    );
    expectExactKeys(
        out.stacks.SearchableStack.Outputs,
        new Set(['ElasticsearchDomainArn', 'ElasticsearchDomainEndpoint'])
    );

    // Check connections
    expectExactKeys(
        out.stacks.ConnectionStack.Resources,
        new Set(['UserpostsResolver', 'UserPostuserResolver', 'UserPostpostResolver', 'PostauthorsResolver'])
    );
    expectExactKeys(
        out.stacks.ConnectionStack.Outputs,
        new Set([])
    );

    // Check function stack
    expectExactKeys(
        out.stacks.FunctionDirectiveStack.Resources,
        new Set(['ScorefuncLambdaDataSourceRole', 'ScorefuncLambdaDataSource', 'InvokeScorefuncLambdaDataSource', 'PostscoreResolver'])
    );
    expectExactKeys(
        out.stacks.ConnectionStack.Outputs,
        new Set([])
    );

    // Check http stack
    expectExactKeys(
        out.stacks.HttpStack.Resources,
        new Set(['httpswwwprofpicorgDataSource', 'UserprofpicResolver'])
    )
    expectExactKeys(
        out.stacks.HttpStack.Outputs,
        new Set([])
    );
}