import { ResourceConstants } from 'graphql-transformer-common';
import { GraphQLTransform, DeploymentResources } from 'graphql-transformer-core';
import { DynamoDBModelTransformer } from 'graphql-dynamodb-transformer';
import { KeyTransformer } from 'graphql-key-transformer';
import { ModelConnectionTransformer } from 'graphql-connection-transformer';
import { ModelAuthTransformer } from 'graphql-auth-transformer';
import { CloudFormationClient } from '../CloudFormationClient';
import { Output } from 'aws-sdk/clients/cloudformation';
import { GraphQLClient } from '../GraphQLClient';
import { deploy } from '../deployNestedStacks';
import emptyBucket from '../emptyBucket';
import { S3Client } from '../S3Client';
import { default as S3 } from 'aws-sdk/clients/s3';
import { default as moment } from 'moment';

jest.setTimeout(2000000);

const cf = new CloudFormationClient('us-west-2');
const customS3Client = new S3Client('us-west-2');
const awsS3Client = new S3({ region: 'us-west-2' });

const BUILD_TIMESTAMP = moment().format('YYYYMMDDHHmmss');
const STACK_NAME = `NewConnectionTransformerTest-${BUILD_TIMESTAMP}`;
const BUCKET_NAME = `appsync-new-connection-transformer-test-${BUILD_TIMESTAMP}`;
const LOCAL_FS_BUILD_DIR = '/tmp/new_connection_transform_tests/';
const S3_ROOT_DIR_KEY = 'deployments';

let GRAPHQL_CLIENT: GraphQLClient = undefined;

function outputValueSelector(key: string) {
  return (outputs: Output[]) => {
    const output = outputs.find((o: Output) => o.OutputKey === key);
    return output ? output.OutputValue : null;
  };
}

beforeAll(async () => {
  const validSchema = `
type Child
	@model
	@key(fields: ["id", "name"])
{
	id: ID!
	name: String!

	parents: [Parent] @connection(keyName: "byChild", fields: ["id"])
}

type Parent
	@model
	@key(name: "byChild", fields: ["childID", "childName"])
{
	id: ID!
	childID: ID!
	childName: String!

	child: Child @connection(fields: ["childID", "childName"])
}

type User
	@model
	@key(fields: ["id", "name", "surname"])
{
	id: ID!
	name: String!
    surname: String!

    friendships: [Friendship] @connection(keyName: "byUser", fields: ["id"])
}

type Friendship
    @model
    @key(name: "byUser", fields: ["userID", "friendID"])
{
    id: ID!
    userID: ID!
    friendID: ID!

    friend: [User] @connection(fields: ["friendID"])
}

type UserModel
    @model
    @key(fields: ["id", "rollNumber"])
    @key(name: "composite", fields: ["id", "name", "surname"])
{
    id: ID!
    rollNumber: Int!
	name: String!
    surname: String!

    authorPosts: [PostAuthor] @connection(keyName: "byAuthor", fields: ["id"])
}


type PostModel @model {
	id: ID!
	authorID: ID!
	authorName: String!
	authorSurname: String!
	postContents: [String]

    authors: [UserModel] @connection(keyName: "composite", fields: ["authorID", "authorName", "authorSurname"])
    singleAuthor: User @connection(fields: ["authorID", "authorName", "authorSurname"])
}

type Post @model {
	id: ID!
	authorID: ID!
	postContents: [String]
	authors: [User] @connection(fields: ["authorID"], limit: 50)
}

type PostAuthor
    @model
    @key(name: "byAuthor", fields: ["authorID", "postID"])
{
    id: ID!
    authorID: ID!
    postID: ID!

    post: Post @connection(fields: ["postID"])
}
`;
  let out: DeploymentResources = undefined;
  try {
    const transformer = new GraphQLTransform({
      transformers: [
        new DynamoDBModelTransformer(),
        new KeyTransformer(),
        new ModelConnectionTransformer(),
        new ModelAuthTransformer({
          authConfig: {
            defaultAuthentication: {
              authenticationType: 'API_KEY',
            },
            additionalAuthenticationProviders: [],
          },
        }),
      ],
    });
    out = transformer.transform(validSchema);
  } catch (e) {
    console.error(`Failed to transform schema: ${e}`);
    expect(true).toEqual(false);
  }
  try {
    await awsS3Client
      .createBucket({
        Bucket: BUCKET_NAME,
      })
      .promise();
  } catch (e) {
    console.error(`Failed to create S3 bucket: ${e}`);
    expect(true).toEqual(false);
  }
  try {
    console.log('Creating Stack ' + STACK_NAME);
    const finishedStack = await deploy(
      customS3Client,
      cf,
      STACK_NAME,
      out,
      { CreateAPIKey: '1' },
      LOCAL_FS_BUILD_DIR,
      BUCKET_NAME,
      S3_ROOT_DIR_KEY,
      BUILD_TIMESTAMP,
    );
    // Arbitrary wait to make sure everything is ready.
    await cf.wait(5, () => Promise.resolve());
    console.log('Successfully created stack ' + STACK_NAME);
    expect(finishedStack).toBeDefined();
    console.log(JSON.stringify(finishedStack, null, 4));
    const getApiEndpoint = outputValueSelector(ResourceConstants.OUTPUTS.GraphQLAPIEndpointOutput);
    const getApiKey = outputValueSelector(ResourceConstants.OUTPUTS.GraphQLAPIApiKeyOutput);
    const endpoint = getApiEndpoint(finishedStack.Outputs);
    const apiKey = getApiKey(finishedStack.Outputs);
    expect(apiKey).toBeDefined();
    expect(endpoint).toBeDefined();
    GRAPHQL_CLIENT = new GraphQLClient(endpoint, { 'x-api-key': apiKey });
  } catch (e) {
    console.error(e);
    expect(true).toEqual(false);
  }
});

afterAll(async () => {
  try {
    console.log('Deleting stack ' + STACK_NAME);
    await cf.deleteStack(STACK_NAME);
    await cf.waitForStack(STACK_NAME);
    console.log('Successfully deleted stack ' + STACK_NAME);
  } catch (e) {
    if (e.code === 'ValidationError' && e.message === `Stack with id ${STACK_NAME} does not exist`) {
      // The stack was deleted. This is good.
      expect(true).toEqual(true);
      console.log('Successfully deleted stack ' + STACK_NAME);
    } else {
      console.error(e);
      expect(true).toEqual(false);
    }
  }
  try {
    await emptyBucket(BUCKET_NAME);
  } catch (e) {
    console.error(`Failed to empty S3 bucket: ${e}`);
  }
});

/**
 * Test queries below
 */

test('Test Parent.child getItem', async () => {
  const createChild = await GRAPHQL_CLIENT.query(
    `mutation {
        createChild(input: { id: "1", name: "child1" }) {
            id
            name
        }
    }`,
    {},
  );
  expect(createChild.data.createChild.id).toBeDefined();
  expect(createChild.data.createChild.name).toEqual('child1');
  const createParent = await GRAPHQL_CLIENT.query(
    `mutation {
        createParent(input: { childID: "1", childName: "${createChild.data.createChild.name}" }) {
            id
            childID
            childName
        }
    }`,
    {},
  );
  expect(createParent.data.createParent.id).toBeDefined();
  expect(createParent.data.createParent.childID).toEqual(createChild.data.createChild.id);
  expect(createParent.data.createParent.childName).toEqual(createChild.data.createChild.name);
  const queryParent = await GRAPHQL_CLIENT.query(
    `query {
        getParent(id: "${createParent.data.createParent.id}") {
            id
            child {
                id
                name
            }
        }
    }`,
    {},
  );
  expect(queryParent.data.getParent).toBeDefined();
  const child = queryParent.data.getParent.child;
  expect(child.id).toEqual(createParent.data.createParent.childID);
  expect(child.name).toEqual(createParent.data.createParent.childName);
});

test('Test Child.parents query', async () => {
  const createChild = await GRAPHQL_CLIENT.query(
    `mutation {
        createChild(input: { id: "2", name: "child2" }) {
            id
            name
        }
    }`,
    {},
  );
  expect(createChild.data.createChild.id).toBeDefined();
  expect(createChild.data.createChild.name).toEqual('child2');

  const createParent1 = await GRAPHQL_CLIENT.query(
    `mutation {
        createParent(input: { childID: "${createChild.data.createChild.id}", childName: "${createChild.data.createChild.name}" }) {
            id
            childID
            childName
        }
    }`,
    {},
  );
  expect(createParent1.data.createParent.id).toBeDefined();
  expect(createParent1.data.createParent.childID).toEqual(createChild.data.createChild.id);
  expect(createParent1.data.createParent.childName).toEqual(createChild.data.createChild.name);

  const queryChild = await GRAPHQL_CLIENT.query(
    `query {
        getChild(id: "${createChild.data.createChild.id}", name: "${createChild.data.createChild.name}") {
            id
            parents {
                items {
                    id
                    childID
                    childName
                }
            }
        }
    }`,
    {},
  );
  expect(queryChild.data.getChild).toBeDefined();
  const items = queryChild.data.getChild.parents.items;
  expect(items.length).toEqual(1);
  expect(items[0].id).toEqual(createParent1.data.createParent.id);
  expect(items[0].childID).toEqual(createParent1.data.createParent.childID);
  expect(items[0].childName).toEqual(createParent1.data.createParent.childName);
});

test('Test PostModel.singleAuthor GetItem with composite sortkey', async () => {
  const createUser = await GRAPHQL_CLIENT.query(
    `mutation {
        createUser(input: { id: "123", name: "Bob", surname: "Rob" }) {
          id
          name
          surname
        }
      }`,
    {},
  );

  expect(createUser.data.createUser.id).toBeDefined();
  expect(createUser.data.createUser.name).toEqual('Bob');
  expect(createUser.data.createUser.surname).toEqual('Rob');
  const createPostModel = await GRAPHQL_CLIENT.query(
    `mutation {
        createPostModel(input: { authorID: "${createUser.data.createUser.id}",
                                 authorName: "${createUser.data.createUser.name}",
                                 authorSurname: "${createUser.data.createUser.surname}",
                                 postContents: "potato" }) {
          id
          authorID
          authorName
          authorSurname
          postContents
        }
      }`,
    {},
  );
  expect(createPostModel.data.createPostModel.id).toBeDefined();
  expect(createPostModel.data.createPostModel.authorID).toEqual(createUser.data.createUser.id);
  expect(createPostModel.data.createPostModel.authorName).toEqual(createUser.data.createUser.name);
  expect(createPostModel.data.createPostModel.authorSurname).toEqual(createUser.data.createUser.surname);
  const queryPostModel = await GRAPHQL_CLIENT.query(
    `query {
        getPostModel(id: "${createPostModel.data.createPostModel.id}") {
            id
            singleAuthor {
                id
                name
                surname
            }
        }
    }`,
    {},
  );
  expect(queryPostModel.data.getPostModel).toBeDefined();
  const author = queryPostModel.data.getPostModel.singleAuthor;
  expect(author.id).toEqual(createUser.data.createUser.id);
  expect(author.name).toEqual(createUser.data.createUser.name);
  expect(author.surname).toEqual(createUser.data.createUser.surname);
});

test('Test PostModel.authors query with composite sortkey', async () => {
  const createUser = await GRAPHQL_CLIENT.query(
    `mutation {
        createUserModel(input: { id: "123", rollNumber: 1, name: "Bob", surname: "Rob" }) {
          id
          rollNumber
          name
          surname
        }
      }`,
    {},
  );
  expect(createUser.data.createUserModel.id).toBeDefined();
  expect(createUser.data.createUserModel.name).toEqual('Bob');
  expect(createUser.data.createUserModel.rollNumber).toEqual(1);
  expect(createUser.data.createUserModel.surname).toEqual('Rob');
  const createUser2 = await GRAPHQL_CLIENT.query(
    `mutation {
        createUserModel(input: { id: "123", rollNumber: 2, name: "Bob", surname: "Rob" }) {
          id
          rollNumber
          name
          surname
        }
      }`,
    {},
  );
  expect(createUser2.data.createUserModel.id).toBeDefined();
  expect(createUser2.data.createUserModel.name).toEqual('Bob');
  expect(createUser2.data.createUserModel.rollNumber).toEqual(2);
  expect(createUser2.data.createUserModel.surname).toEqual('Rob');
  const createPostModel = await GRAPHQL_CLIENT.query(
    `mutation {
        createPostModel(input: { authorID: "${createUser.data.createUserModel.id}",
                                 authorName: "${createUser.data.createUserModel.name}",
                                 authorSurname: "${createUser.data.createUserModel.surname}",
                                 postContents: "potato" }) {
          id
          authorID
          authorName
          authorSurname
          postContents
        }
      }`,
    {},
  );
  expect(createPostModel.data.createPostModel.id).toBeDefined();
  expect(createPostModel.data.createPostModel.authorID).toEqual(createUser.data.createUserModel.id);
  expect(createPostModel.data.createPostModel.authorName).toEqual(createUser.data.createUserModel.name);
  expect(createPostModel.data.createPostModel.authorSurname).toEqual(createUser.data.createUserModel.surname);
  const queryPostModel = await GRAPHQL_CLIENT.query(
    `query {
        getPostModel(id: "${createPostModel.data.createPostModel.id}") {
            id
            authors {
                items {
                    id
                    rollNumber
                    name
                    surname
                }
            }
        }
    }`,
    {},
  );
  expect(queryPostModel.data.getPostModel).toBeDefined();
  const items = queryPostModel.data.getPostModel.authors.items;
  expect(items.length).toEqual(2);
  expect(items[0].id).toEqual(createUser.data.createUserModel.id);
  try {
    expect(items[0].rollNumber).toEqual(createUser.data.createUserModel.rollNumber);
    expect(items[1].rollNumber).toEqual(createUser2.data.createUserModel.rollNumber);
  } catch (error) {
    expect(items[1].rollNumber).toEqual(createUser.data.createUserModel.rollNumber);
    expect(items[0].rollNumber).toEqual(createUser2.data.createUserModel.rollNumber);
  }
  expect(items[0].name).toEqual(createUser.data.createUserModel.name);
  expect(items[0].surname).toEqual(createUser.data.createUserModel.surname);
  expect(items[1].id).toEqual(createUser2.data.createUserModel.id);
  expect(items[1].surname).toEqual(createUser2.data.createUserModel.surname);
  expect(items[1].name).toEqual(createUser2.data.createUserModel.name);
});

test(`Test the default limit.`, async () => {
  for (let i = 0; i < 51; i++) {
    await GRAPHQL_CLIENT.query(
      `mutation {
          createUser(input: { id: "11", name: "user${i}", surname: "sub${i}" }) {
            id
            name
            surname
          }
        }`,
      {},
    );
  };

  const createResponse = await GRAPHQL_CLIENT.query(`
    mutation {
      createPost(input: {authorID: "11", postContents: "helloWorld"}) {
        authorID
        id
        authors {
          items {
            name
            surname
            id
          }
        }
      }
    }`,{});
  expect(createResponse).toBeDefined();
  expect(createResponse.data.createPost.authorID).toEqual("11");
  expect(createResponse.data.createPost.authors.items.length).toEqual(50);
});

test('Test PostModel.authors query with composite sortkey passed as arg.', async () => {
  const createUser = await GRAPHQL_CLIENT.query(
    `mutation {
        createUser(input: { id: "123", name: "Bobby", surname: "Rob" }) {
          id
          name
          surname
        }
      }`,
    {},
  );
  expect(createUser.data.createUser.id).toBeDefined();
  expect(createUser.data.createUser.name).toEqual('Bobby');
  expect(createUser.data.createUser.surname).toEqual('Rob');
  const createPost = await GRAPHQL_CLIENT.query(
    `mutation {
        createPost(input: { id: "321", authorID: "${createUser.data.createUser.id}", postContents: "potato"}) {
          id
          authorID
          postContents
        }
      }`,
    {},
  );
  expect(createPost.data.createPost.id).toBeDefined();
  expect(createPost.data.createPost.authorID).toEqual(createUser.data.createUser.id);
  const queryPost = await GRAPHQL_CLIENT.query(
    `query {
        getPost(id: "${createPost.data.createPost.id}") {
            id
            authors(nameSurname: {beginsWith: {name: "${createUser.data.createUser.name}", surname: "${createUser.data.createUser.surname}"}}) {
                items {
                    id
                    name
                    surname
                }
            }
        }
    }`,
    {},
  );
  expect(queryPost.data.getPost).toBeDefined();
  const items = queryPost.data.getPost.authors.items;
  expect(items.length).toEqual(1);
  expect(items[0].id).toEqual(createUser.data.createUser.id);
  expect(items[0].name).toEqual(createUser.data.createUser.name);
  expect(items[0].surname).toEqual(createUser.data.createUser.surname);
});

test('Test User.authorPosts.posts query followed by getItem (intermediary model)', async () => {
  const createPostAuthor = await GRAPHQL_CLIENT.query(`mutation {
        createPostAuthor(input: { authorID: "123", postID: "321" }) {
            id
            authorID
            postID
        }
    }`, {});
  expect(createPostAuthor.data.createPostAuthor.id).toBeDefined();
  expect(createPostAuthor.data.createPostAuthor.authorID).toEqual('123');
  expect(createPostAuthor.data.createPostAuthor.postID).toEqual('321');
  const queryUser = await GRAPHQL_CLIENT.query(
    `query {
        getUserModel(id: "123", rollNumber: 1) {
            id
            authorPosts {
                items {
                    post {
                        id
                        postContents
                    }
                }
            }
        }
    }`,
    {},
  );
  expect(queryUser.data.getUserModel).toBeDefined();
  const items = queryUser.data.getUserModel.authorPosts.items;
  expect(items.length).toEqual(1);
  expect(items[0].post.id).toEqual('321');
  expect(items[0].post.postContents).toEqual(['potato']);
});

test('Test User.friendship.friend query (reflexive has many).', async () => {
  const createUser = await GRAPHQL_CLIENT.query(
    `mutation {
        createUser(input: { id: "12", name: "Bobby", surname: "Rob" }) {
          id
          name
          surname
        }
      }`,
    {},
  );
  expect(createUser.data.createUser.id).toBeDefined();
  expect(createUser.data.createUser.name).toEqual('Bobby');
  expect(createUser.data.createUser.surname).toEqual('Rob');
  const createUser1 = await GRAPHQL_CLIENT.query(
    `mutation {
        createUser(input: { id: "13", name: "Bob", surname: "Rob" }) {
          id
          name
          surname
        }
      }`,
    {},
  );
  expect(createUser1.data.createUser.id).toBeDefined();
  expect(createUser1.data.createUser.name).toEqual('Bob');
  expect(createUser1.data.createUser.surname).toEqual('Rob');
  const createFriendship = await GRAPHQL_CLIENT.query(
    `mutation {
        createFriendship(input: { id: "1", userID: 13, friendID: 12 }) {
          id
          userID
          friendID
        }
      }`,
    {},
  );
  expect(createFriendship.data.createFriendship.id).toBeDefined();
  expect(createFriendship.data.createFriendship.userID).toEqual('13');
  expect(createFriendship.data.createFriendship.friendID).toEqual('12');
  const queryUser = await GRAPHQL_CLIENT.query(
    `query {
        getUser(id: "13", name: "Bob", surname: "Rob") {
            id
            friendships {
                items {
                    friend {
                        items {
                            id
                            name
                        }
                    }
                }
            }
        }
    }`,
    {},
  );
  expect(queryUser.data.getUser).toBeDefined();
  const items = queryUser.data.getUser.friendships.items;
  expect(items.length).toEqual(1);
  expect(items[0].friend.items[0].id).toEqual('12');
  expect(items[0].friend.items[0].name).toEqual('Bobby');
});
