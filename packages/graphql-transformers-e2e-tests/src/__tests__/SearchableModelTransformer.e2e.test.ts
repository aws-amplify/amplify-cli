import { ResourceConstants } from 'graphql-transformer-common';
import { GraphQLTransform, ConflictHandlerType } from 'graphql-transformer-core';
import { DynamoDBModelTransformer } from 'graphql-dynamodb-transformer';
import { KeyTransformer } from 'graphql-key-transformer';
import { SearchableModelTransformer } from 'graphql-elasticsearch-transformer';
import { ModelAuthTransformer } from 'graphql-auth-transformer';
import { CloudFormationClient } from '../CloudFormationClient';
import { S3Client } from '../S3Client';
import { Output } from 'aws-sdk/clients/cloudformation';
import { GraphQLClient } from '../GraphQLClient';
import { deploy } from '../deployNestedStacks';
import { default as moment } from 'moment';
import { default as S3 } from 'aws-sdk/clients/s3';
import emptyBucket from '../emptyBucket';
import addStringSets from '../stringSetMutations';

// tslint:disable: no-magic-numbers
jest.setTimeout(60000 * 60);

const cf = new CloudFormationClient('us-west-2');
const customS3Client = new S3Client('us-west-2');
const awsS3Client = new S3({ region: 'us-west-2' });
let GRAPHQL_CLIENT: GraphQLClient = undefined;

const BUILD_TIMESTAMP = moment().format('YYYYMMDDHHmmss');
const STACK_NAME = `TestSearchableModelTransformer-${BUILD_TIMESTAMP}`;
const BUCKET_NAME = `testsearchablemodeltransformer-${BUILD_TIMESTAMP}`;
const LOCAL_FS_BUILD_DIR = '/tmp/model_searchable_transform_tests/';
const S3_ROOT_DIR_KEY = 'deployments';

const fragments = [`fragment FullPost on Post { id author title ups downs percentageUp isPublished createdAt }`];

const runQuery = async (query: string, logContent: string) => {
  try {
    const q = [query, ...fragments].join('\n');
    const response = await GRAPHQL_CLIENT.query(q, {});
    console.log(logContent + JSON.stringify(response, null, 4));
    return response;
  } catch (e) {
    console.error(e);
    return null;
  }
};

const createEntries = async () => {
  // create posts
  const logContent = 'createPost response: ';
  await runQuery(getCreatePostsMutation('snvishna', 'test', 157, 10, 97.4, true), logContent);
  await runQuery(getCreatePostsMutation('snvishna', 'test title', 60, 30, 21.0, false), logContent);
  await runQuery(getCreatePostsMutation('shankar', 'test title', 160, 30, 97.6, false), logContent);
  await runQuery(getCreatePostsMutation('snvishna', 'test TITLE', 170, 30, 88.8, true), logContent);
  await runQuery(getCreatePostsMutation('snvishna', 'test title', 200, 50, 11.9, false), logContent);
  await runQuery(getCreatePostsMutation('snvishna', 'test title', 170, 30, 88.8, true), logContent);
  await runQuery(getCreatePostsMutation('snvishna', 'test title', 160, 30, 97.6, false), logContent);
  await runQuery(getCreatePostsMutation('snvishna', 'test title', 170, 30, 77.7, true), logContent);
  // create users
  await GRAPHQL_CLIENT.query(getCreateUsersMutation(), {
    input: { name: 'user1', userItems: ['thing1', 'thing2'], createdAt: '2016-07-20' },
  });
  await GRAPHQL_CLIENT.query(getCreateUsersMutation(), {
    input: { name: 'user2', userItems: ['thing3', 'thing4'], createdAt: '2017-06-10' },
  });
  await GRAPHQL_CLIENT.query(getCreateUsersMutation(), {
    input: { name: 'user3', userItems: ['thing5', 'thing6'], createdAt: '2017-08-22' },
  });
  await GRAPHQL_CLIENT.query(getCreateUsersMutation(), {
    input: { name: 'user4', userItems: ['thing7', 'thing8'], createdAt: '2019-07-04' },
  });
  // create books
  await GRAPHQL_CLIENT.query(createBookMutation(), {
    input: { author: 'Agatha Christie', name: 'Murder on the Orient Express', genre: 'Mystery' },
  });
  await GRAPHQL_CLIENT.query(createBookMutation(), { input: { author: 'Agatha Christie', name: 'Death on the Nile', genre: 'Mystery' } });
  await GRAPHQL_CLIENT.query(createBookMutation(), { input: { author: 'Ayn Rand', name: 'Anthem', genre: 'Science Fiction' } });
  // Waiting for the ES Cluster + Streaming Lambda infra to be setup
  console.log('Waiting for the ES Cluster + Streaming Lambda infra to be setup');
  await cf.wait(120, () => Promise.resolve());
};

beforeAll(async () => {
  const validSchema = `
    type Post @model @searchable {
        id: ID!
        author: String!
        title: String
        content: String
        url: String
        ups: Int
        downs: Int
        version: Int
        relatedPosts: [Post]
        postedAt: String
        createdAt: AWSDateTime
        comments: [String!]
        ratings: [Int!]
        percentageUp: Float
        isPublished: Boolean
        jsonField: AWSJSON
    }

    type User @model @searchable {
      id: ID!
      name: String!
      createdAt: AWSDate
      userItems: [String]
    }

    type Book
    @model
    @key(fields: ["author", "name"])
    @searchable
    {
      author: String!
      name: String!
      genre: String!
    }

    type Todo
    @model
    @searchable {
      id: ID
      name: String!
      createdAt: AWSDateTime
      description: String
    }
    `;
  const transformer = new GraphQLTransform({
    transformers: [
      new DynamoDBModelTransformer(),
      new KeyTransformer(),
      new ModelAuthTransformer({
        authConfig: {
          defaultAuthentication: {
            authenticationType: 'API_KEY',
          },
          additionalAuthenticationProviders: [],
        },
      }),
      new SearchableModelTransformer(),
    ],
    // only enable datastore features on todo
    transformConfig: {
      ResolverConfig: {
        models: {
          Todo: {
            ConflictHandler: ConflictHandlerType.AUTOMERGE,
            ConflictDetection: 'VERSION',
          },
        },
      },
    },
  });
  try {
    await awsS3Client.createBucket({ Bucket: BUCKET_NAME }).promise();
  } catch (e) {
    console.error(`Failed to create bucket: ${e}`);
  }
  try {
    // change create/update to create string sets
    const out = addStringSets(transformer.transform(validSchema));
    // fs.writeFileSync('./out.json', JSON.stringify(out, null, 4))
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
    await cf.wait(120, () => Promise.resolve());
    console.log('Successfully created stack ' + STACK_NAME);
    expect(finishedStack).toBeDefined();
    const getApiEndpoint = outputValueSelector(ResourceConstants.OUTPUTS.GraphQLAPIEndpointOutput);
    const getApiKey = outputValueSelector(ResourceConstants.OUTPUTS.GraphQLAPIApiKeyOutput);
    const endpoint = getApiEndpoint(finishedStack.Outputs);
    const apiKey = getApiKey(finishedStack.Outputs);
    expect(apiKey).toBeDefined();
    expect(endpoint).toBeDefined();
    GRAPHQL_CLIENT = new GraphQLClient(endpoint, { 'x-api-key': apiKey });

    // Create sample mutations to test search queries
    await createEntries();
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

test('Test searchPosts with sort field on a string field', async () => {
  const firstQuery = await runQuery(
    `query {
        searchPosts(sort: {
            field: id
            direction: desc
        }){
            items{
              ...FullPost
            }
            nextToken
          }
    }`,
    'Test searchPosts with filter ',
  );
  expect(firstQuery).toBeDefined();
  expect(firstQuery.data.searchPosts).toBeDefined();
  const fourthItemOfFirstQuery = firstQuery.data.searchPosts.items[3];
  const secondQuery = await runQuery(
    `query {
        searchPosts(limit: 3, sort: {
            field: id
            direction: desc
        }){
            items{
              ...FullPost
            }
            nextToken
          }
    }`,
    'Test searchPosts with limit ',
  );
  expect(secondQuery).toBeDefined();
  expect(secondQuery.data.searchPosts).toBeDefined();
  const nextToken = secondQuery.data.searchPosts.nextToken;
  expect(nextToken).toBeDefined();
  const thirdQuery = await runQuery(
    `query {
        searchPosts(nextToken: "${nextToken}", limit: 3, sort: {
            field: id
            direction: desc
        }){
            items{
              ...FullPost
            }
            nextToken
          }
    }`,
    'Test searchPosts with sort limit and nextToken  ',
  );
  expect(thirdQuery).toBeDefined();
  expect(thirdQuery.data.searchPosts).toBeDefined();
  const firstItemOfThirdQuery = thirdQuery.data.searchPosts.items[0];
  expect(firstItemOfThirdQuery).toEqual(fourthItemOfFirstQuery);
});

test('Test searchPosts with sort on date type', async () => {
  const query = await runQuery(
    `query {
        searchPosts(
            sort: {
                field: createdAt
                direction: desc
            }) {
            items {
                ...FullPost
            }
        }
    }`,
    'Test search posts with date type response: ',
  );
  expect(query).toBeDefined();
  expect(query.data.searchPosts).toBeDefined();
  const recentItem = new Date(query.data.searchPosts.items[0].createdAt);
  const oldestItem = new Date(query.data.searchPosts.items[query.data.searchPosts.items.length - 1].createdAt);
  expect(recentItem > oldestItem);
});

test('Test searchPosts query without filter', async () => {
  const response = await runQuery(
    `query {
        searchPosts {
            items { ...FullPost }
        }
    }`,
    'Test searchPosts response without filter response: ',
  );
  expect(response).toBeDefined();
  expect(response.data.searchPosts.items).toBeDefined();
  const items = response.data.searchPosts.items;
  expect(items.length).toBeGreaterThan(0);
});

test('Test searchPosts query with basic filter', async () => {
  const response = await runQuery(
    `query {
        searchPosts(filter: {
            author: { eq: "snvishna" }
        }) {
            items { ...FullPost }
        }
    }`,
    'Test searchPosts response with basic filter response: ',
  );
  expect(response).toBeDefined();
  expect(response.data.searchPosts.items).toBeDefined();
  const items = response.data.searchPosts.items;
  expect(items.length).toEqual(7);
});

test('Test searchPosts query with non-recursive filter', async () => {
  const response = await runQuery(
    `query {
        searchPosts(filter: {
            title: { eq: "test title" }
            ups: { gte: 100 }
            percentageUp: { ne: 77.7 }
            downs: { range: [29, 31] }
            author: { wildcard: "s*a" }
            isPublished: { eq: true }
        }) {
            items { ...FullPost }
        }
    }`,
    'Test searchPosts response with non-recursive filter response: ',
  );
  expect(response).toBeDefined();
  expect(response.data.searchPosts.items).toBeDefined();
  const items = response.data.searchPosts.items;
  expect(items.length).toEqual(1);
  expect(items[0].id).toBeDefined();
  expect(items[0].author).toEqual('snvishna');
  expect(items[0].title).toEqual('test title');
  expect(items[0].ups).toEqual(170);
  expect(items[0].downs).toEqual(30);
  expect(items[0].percentageUp).toEqual(88.8);
  expect(items[0].isPublished).toEqual(true);
});

test('Test searchPosts query with recursive filter 1', async () => {
  const response = await runQuery(
    `query {
        searchPosts(filter: {
            downs: { eq: 10 }
            or: [
                {
                    author: { wildcard: "s*a" },
                    downs: { eq: 30 }
                },
                {
                    isPublished: { eq: true }
                }
            ]
        }) {
            items { ...FullPost }
        }
    }`,
    'Test searchPosts response with recursive filter 1 response: ',
  );
  expect(response).toBeDefined();
  expect(response.data.searchPosts.items).toBeDefined();
  const items = response.data.searchPosts.items;
  expect(items.length).toEqual(1);
  expect(items[0].id).toBeDefined();
  expect(items[0].author).toEqual('snvishna');
  expect(items[0].title).toEqual('test');
  expect(items[0].ups).toEqual(157);
  expect(items[0].downs).toEqual(10);
  expect(items[0].percentageUp).toEqual(97.4);
  expect(items[0].isPublished).toEqual(true);
});

test('Test searchPosts query with recursive filter 2', async () => {
  const response = await runQuery(
    `query {
        searchPosts(filter: {
            downs: { eq: 30 }
            or: [
                {
                    author: { wildcard: "s*a" },
                    downs: { eq: 30 }
                },
                {
                    isPublished: { eq: true }
                }
            ]
        }) {
            items { ...FullPost }
        }
    }`,
    'Test searchPosts response with recursive filter 2 response: ',
  );
  expect(response).toBeDefined();
  expect(response.data.searchPosts.items).toBeDefined();
  const items = response.data.searchPosts.items;
  expect(items.length).toEqual(5);
});

test('Test searchPosts query with recursive filter 3', async () => {
  const response = await runQuery(
    `query {
        searchPosts(filter: {
            ups:{  gt:199  }
            and:[
              {
                or:[
                  {
                    author:{  wildcard:"s*a"  }
                  },
                  {
                    downs:{  ne:30  }
                  }
                ]
              },
              {
                isPublished:{  eq:false  }
              }
            ]
          }) {
            items { ...FullPost }
        }
    }`,
    'Test searchPosts query with recursive filter 3 response: ',
  );
  expect(response).toBeDefined();
  expect(response.data.searchPosts.items).toBeDefined();
  const items = response.data.searchPosts.items;
  expect(items.length).toEqual(1);
  expect(items[0].id).toBeDefined();
  expect(items[0].author).toEqual('snvishna');
  expect(items[0].title).toEqual('test title');
  expect(items[0].ups).toEqual(200);
  expect(items[0].downs).toEqual(50);
  expect(items[0].percentageUp).toEqual(11.9);
  expect(items[0].isPublished).toEqual(false);
});

test('Test searchPosts query with recursive filter 4', async () => {
  const response = await runQuery(
    `query {
        searchPosts(filter: {
            ups:{  gt:100  }
            and:[
              {
                or:[
                  {
                    author:{  wildcard:"s*a"  }
                  },
                  {
                    downs:{  ne:30  }
                  }
                ]
              },
              {
                isPublished:{  eq:false  }
              }
            ],
            not: {
              percentageUp: { lt: 20 }
            }
          }) {
            items { ...FullPost }
        }
    }`,
    'Test searchPosts query with recursive filter 4 response: ',
  );
  expect(response).toBeDefined();
  expect(response.data.searchPosts.items).toBeDefined();
  const items = response.data.searchPosts.items;
  expect(items.length).toEqual(1);
  expect(items[0].id).toBeDefined();
  expect(items[0].author).toEqual('snvishna');
  expect(items[0].title).toEqual('test title');
  expect(items[0].ups).toEqual(160);
  expect(items[0].downs).toEqual(30);
  expect(items[0].percentageUp).toEqual(97.6);
  expect(items[0].isPublished).toEqual(false);
});

test('Test searchPosts query with recursive filter 5', async () => {
  const response = await runQuery(
    `query {
        searchPosts(filter: {
            downs:{  ne:30  }
            or:[
              {
                and:[
                  {
                    author:{  wildcard:"s*a"  },
                    not: {
                      isPublished: { eq: true }
                    }
                  }
                ]
              },
              {
                percentageUp:{  range: [90.0, 100.0]  }
              }
            ]
            and: {
              title:{ matchPhrasePrefix: "test t" }
            }
          }) {
            items { ...FullPost }
        }
    }`,
    'Test searchPosts query with recursive filter 5 response: ',
  );
  expect(response).toBeDefined();
  expect(response.data.searchPosts.items).toBeDefined();
  const items = response.data.searchPosts.items;
  expect(items.length).toEqual(1);
  expect(items[0].id).toBeDefined();
  expect(items[0].author).toEqual('snvishna');
  expect(items[0].title).toEqual('test title');
  expect(items[0].ups).toEqual(200);
  expect(items[0].downs).toEqual(50);
  expect(items[0].percentageUp).toEqual(11.9);
  expect(items[0].isPublished).toEqual(false);
});

test('Test searchPosts query with recursive filter 6', async () => {
  const response = await runQuery(
    `query {
        searchPosts(filter: {
            not: {
              title:{ wildcard: "*test*" }
            }
            or:[
              {
                and:[
                  {
                    author:{  wildcard:"s*a"  },
                    not: {
                      isPublished: { eq: true }
                    }
                  }
                ]
              },
              {
                percentageUp:{  range: [90.0, 100.0]  }
              }
            ]
          }) {
            items { ...FullPost }
        }
    }`,
    'Test searchPosts query with recursive filter 6 response: ',
  );
  expect(response).toBeDefined();
  expect(response.data.searchPosts.items).toBeDefined();
  const items = response.data.searchPosts.items;
  expect(items.length).toEqual(0);
});

test('Test deletePosts syncing with Elasticsearch', async () => {
  // Create Post
  const title = 'to be deleted';
  const postToBeDeletedResponse = await runQuery(
    getCreatePostsMutation('test author new', title, 1157, 1000, 22.2, true),
    'createPost (to be deleted) response: ',
  );
  expect(postToBeDeletedResponse).toBeDefined();
  expect(postToBeDeletedResponse.data.createPost).toBeDefined();
  expect(postToBeDeletedResponse.data.createPost.id).toBeDefined();

  // Wait for the Post to sync to Elasticsearch
  await cf.wait(10, () => Promise.resolve());

  const searchResponse1 = await runQuery(
    `query {
        searchPosts(filter: {
            title: { eq: "${title}" }
        }) {
            items { ...FullPost }
        }
    }`,
    'Test deletePosts syncing with Elasticsearch Search_Before response: ',
  );
  expect(searchResponse1).toBeDefined();
  expect(searchResponse1.data.searchPosts.items).toBeDefined();
  const items1 = searchResponse1.data.searchPosts.items;
  expect(items1.length).toEqual(1);
  expect(items1[0].id).toEqual(postToBeDeletedResponse.data.createPost.id);
  expect(items1[0].author).toEqual('test author new');
  expect(items1[0].title).toEqual(title);
  expect(items1[0].ups).toEqual(1157);
  expect(items1[0].downs).toEqual(1000);
  expect(items1[0].percentageUp).toEqual(22.2);
  expect(items1[0].isPublished).toEqual(true);

  const deleteResponse = await runQuery(
    `mutation {
        deletePost(input: {
            id: "${postToBeDeletedResponse.data.createPost.id}"
        }) {
            ...FullPost
        }
    }`,
    'Test deletePosts syncing with Elasticsearch Perform_Delete response: ',
  );
  expect(deleteResponse).toBeDefined();
  expect(deleteResponse.data.deletePost).toBeDefined();
  expect(deleteResponse.data.deletePost.id).toEqual(postToBeDeletedResponse.data.createPost.id);

  // Wait for the Deleted Post to sync to Elasticsearch
  await cf.wait(10, () => Promise.resolve());

  const searchResponse2 = await runQuery(
    `query {
        searchPosts(filter: {
            title: { eq: "${title}" }
        }) {
            items { ...FullPost }
        }
    }`,
    'Test deletePosts syncing with Elasticsearch Search_After response: ',
  );
  expect(searchResponse2).toBeDefined();
  expect(searchResponse2.data.searchPosts.items).toBeDefined();
  const items2 = searchResponse2.data.searchPosts.items;
  expect(items2.length).toEqual(0);
});

test('Test updatePost syncing with Elasticsearch', async () => {
  // Create Post
  const author = 'test author update new';
  const title = 'to be updated new';
  const ups = 2157;
  const downs = 2000;
  const percentageUp = 22.2;
  const isPublished = true;

  const postToBeUpdatedResponse = await runQuery(
    getCreatePostsMutation(author, title, ups, downs, percentageUp, isPublished),
    'createPost (to be updated) response: ',
  );
  expect(postToBeUpdatedResponse).toBeDefined();
  expect(postToBeUpdatedResponse.data.createPost).toBeDefined();

  const id = postToBeUpdatedResponse.data.createPost.id;
  expect(id).toBeDefined();

  // Wait for the Post to sync to Elasticsearch
  await cf.wait(10, () => Promise.resolve());

  const searchResponse1 = await runQuery(
    `query {
        searchPosts(filter: {
            id: { eq: "${id}" }
        }) {
            items { ...FullPost }
        }
    }`,
    'Test updatePost syncing with Elasticsearch Search_Before response: ',
  );
  expect(searchResponse1).toBeDefined();
  expect(searchResponse1.data.searchPosts.items).toBeDefined();
  const items1 = searchResponse1.data.searchPosts.items;
  expect(items1.length).toEqual(1);
  expect(items1[0].id).toEqual(id);
  expect(items1[0].author).toEqual(author);
  expect(items1[0].title).toEqual(title);
  expect(items1[0].ups).toEqual(ups);
  expect(items1[0].downs).toEqual(downs);
  expect(items1[0].percentageUp).toEqual(percentageUp);
  expect(items1[0].isPublished).toEqual(isPublished);

  const newTitle = title.concat('_updated');
  const updateResponse = await runQuery(
    `mutation {
        updatePost(input: {
            id: "${id}"
            author: "${author}"
            title: "${newTitle}"
            ups: ${ups}
            downs: ${downs}
            percentageUp: ${percentageUp}
            isPublished: ${isPublished}
        }) {
            ...FullPost
        }
    }`,
    'Test updatePost syncing with Elasticsearch Perform_Update response: ',
  );
  expect(updateResponse).toBeDefined();
  expect(updateResponse.data.updatePost).toBeDefined();
  expect(updateResponse.data.updatePost.id).toEqual(id);
  expect(updateResponse.data.updatePost.title).toEqual(newTitle);

  // Wait for the Update Post to sync to Elasticsearch
  await cf.wait(10, () => Promise.resolve());

  const searchResponse2 = await runQuery(
    `query {
        searchPosts(filter: {
            id: { eq: "${id}" }
        }) {
            items { ...FullPost }
        }
    }`,
    'Test updatePost syncing with Elasticsearch Search_After response: ',
  );
  expect(searchResponse2).toBeDefined();
  expect(searchResponse2.data.searchPosts.items).toBeDefined();
  const items2 = searchResponse2.data.searchPosts.items;
  expect(items2.length).toEqual(1);
  expect(items2[0].id).toEqual(id);
  expect(items2[0].author).toEqual(author);
  expect(items2[0].title).toEqual(newTitle);
  expect(items2[0].ups).toEqual(ups);
  expect(items2[0].downs).toEqual(downs);
  expect(items2[0].percentageUp).toEqual(percentageUp);
  expect(items2[0].isPublished).toEqual(isPublished);
});

test('query users knowing userItems is a string set in ddb but should be a list in es', async () => {
  const searchResponse = await GRAPHQL_CLIENT.query(
    `query {
      searchUsers {
        items {
          id
          name
          userItems
        }
        nextToken
        total
      }
    }`,
    {},
  );
  expect(searchResponse).toBeDefined();
  const items = searchResponse.data.searchUsers.items;
  expect(items.length).toEqual(4);
});

test('query using string range between names', async () => {
  // using string range queries
  const expectedUsers = ['user2', 'user3'];
  const expectedLength = 2;
  const searchResponse = await GRAPHQL_CLIENT.query(
    `query {
      searchUsers(filter: {
        name: {
          lt: "user4"
          gt: "user1"
        }
      }) {
        items {
          id
          name
        }
      }
    }`,
    {},
  );
  expect(searchResponse).toBeDefined();
  const items = searchResponse.data.searchUsers.items;
  console.log(items);
  expect(items.length).toEqual(expectedLength);
  items.forEach((item: any) => {
    expect(expectedUsers).toContain(item.name);
  });
});

test('query using date range for createdAt', async () => {
  const expectedDates = ['2017-06-10', '2017-08-22'];
  const expectedLength = 2;
  const searchResponse = await GRAPHQL_CLIENT.query(
    `query {
      searchUsers(filter: {
        createdAt: {
          lte: "2017-08-22"
          gte: "2017-06-10"
        }
      }) {
        items {
          id
          name
          createdAt
          userItems
        }
      }
    }`,
    {},
  );
  expect(searchResponse).toBeDefined();
  const items = searchResponse.data.searchUsers.items;
  console.log(items);
  expect(items.length).toEqual(expectedLength);
  items.forEach((item: any) => {
    expect(expectedDates).toContain(item.createdAt);
  });
});

test('query for books by Agatha Christie with model using @key', async () => {
  const expectedBookItemsLength = 2;
  const expectedBookNames: string[] = ['Murder on the Orient Express', 'Death on the Nile'];
  const searchResponse = await GRAPHQL_CLIENT.query(
    `
    query SearchBooks {
      searchBooks(filter: {
        author: {
          eq: "Agatha Christie"
        }
      }) {
        items {
          author
          name
          genre
        }
      }
    }
    `,
    {},
  );
  expect(searchResponse).toBeDefined();
  const items: any[] = searchResponse.data.searchBooks.items;
  expect(items.length).toEqual(expectedBookItemsLength);
  items.forEach((item: any) => {
    expect(expectedBookNames).toContain(item.name);
  });
});

test('test searches with datastore enabled types', async () => {
  const createTodoResponse = await createTodo({ id: '001', name: 'get milk' });
  expect(createTodoResponse).toBeDefined();
  let todoName = createTodoResponse.data.createTodo.name;
  let todoVersion = createTodoResponse.data.createTodo._version;

  // Wait for the Todo to sync to Elasticsearch
  await cf.wait(10, () => Promise.resolve());

  let searchTodoResponse = await searchTodos();
  expect(searchTodoResponse).toBeDefined();
  expect(searchTodoResponse.data.searchTodos.items.length).toEqual(1);
  expect(searchTodoResponse.data.searchTodos.items[0].name).toEqual(todoName);
  expect(searchTodoResponse.data.searchTodos.items[0]._version).toEqual(todoVersion);
  todoName = 'get soy milk';

  const updateTodoResponse = await updateTodo({ id: '001', name: todoName, _version: todoVersion });
  expect(updateTodoResponse).toBeDefined();
  todoVersion += 1;
  expect(updateTodoResponse.data.updateTodo.name).toEqual(todoName);
  expect(updateTodoResponse.data.updateTodo._version).toEqual(todoVersion);

  // Wait for the Todo to sync to Elasticsearch
  await cf.wait(10, () => Promise.resolve());

  searchTodoResponse = await searchTodos();
  expect(searchTodoResponse.data.searchTodos.items.length).toEqual(1);
  expect(searchTodoResponse.data.searchTodos.items[0].name).toEqual(todoName);
  expect(searchTodoResponse.data.searchTodos.items[0]._version).toEqual(todoVersion);
});

type TodoInput = {
  id?: string;
  name: string;
  createdAt?: string;
  description?: string;
  _version?: number;
};

async function createTodo(input: TodoInput) {
  const createTodoMutation = `
  mutation (
    $input: CreateTodoInput!
  ) {
    createTodo(input: $input) {
      id
      name
      _version
    }
  }`;
  return await GRAPHQL_CLIENT.query(createTodoMutation, { input });
}

async function updateTodo(input: TodoInput) {
  const updateTodoMutation = `
    mutation (
      $input: UpdateTodoInput!
    ){
      updateTodo(input: $input) {
        id
        name
        _version
      }
    }`;
  return await GRAPHQL_CLIENT.query(updateTodoMutation, { input });
}

async function searchTodos() {
  const searchTodosQuery = `
  query SearchTodos {
    searchTodos {
      items {
        id
        name
        _version
      }
    }
  }`;
  return await GRAPHQL_CLIENT.query(searchTodosQuery, {});
}

function getCreatePostsMutation(
  author: string,
  title: string,
  ups: number,
  downs: number,
  percentageUp: number,
  isPublished: boolean,
): string {
  return `mutation {
        createPost(input: {
            author: "${author}"
            title: "${title}"
            ups: ${ups}
            downs: ${downs}
            percentageUp: ${percentageUp}
            isPublished: ${isPublished}
        }) { ...FullPost }
    }`;
}

function createBookMutation() {
  return `mutation CreateBook( $input: CreateBookInput!) {
      createBook(input: $input) {
        author
        name
        genre
      }
    }
  `;
}

function getCreateUsersMutation() {
  return `mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      name
      createdAt
      userItems
    }
  }`;
}

function outputValueSelector(key: string) {
  return (outputs: Output[]) => {
    const output = outputs.find((o: Output) => o.OutputKey === key);
    return output ? output.OutputValue : null;
  };
}
