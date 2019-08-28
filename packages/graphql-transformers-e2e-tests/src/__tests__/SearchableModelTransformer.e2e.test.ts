import {
    ObjectTypeDefinitionNode, DirectiveNode, parse, FieldDefinitionNode, DocumentNode, DefinitionNode,
    Kind
} from 'graphql'
import { ResourceConstants } from 'graphql-transformer-common'
import GraphQLTransform from 'graphql-transformer-core'
import DynamoDBModelTransformer from 'graphql-dynamodb-transformer'
import SearchableModelTransformer from 'graphql-elasticsearch-transformer'
import ModelAuthTransformer from 'graphql-versioned-transformer'
import { CloudFormationClient } from '../CloudFormationClient'
import { S3Client } from '../S3Client'
import { Output } from 'aws-sdk/clients/cloudformation'
import { GraphQLClient } from '../GraphQLClient'
import { deploy } from '../deployNestedStacks'
import * as moment from 'moment';
import * as S3 from 'aws-sdk/clients/s3'
import emptyBucket from '../emptyBucket'
import * as fs from 'fs'

jest.setTimeout(60000 * 60);

const s3 = new S3Client('us-west-2')
const cf = new CloudFormationClient('us-west-2')

const BUILD_TIMESTAMP = moment().format('YYYYMMDDHHmmss')
const STACK_NAME = `TestSearchableModelTransformer-${BUILD_TIMESTAMP}`
const BUCKET_NAME = `testsearchablemodeltransformer-${BUILD_TIMESTAMP}`
const LOCAL_FS_BUILD_DIR = '/tmp/model_searchable_transform_tests/'
const S3_ROOT_DIR_KEY = 'deployments'

const customS3Client = new S3Client('us-west-2')
const awsS3Client = new S3({ region: 'us-west-2' })

const fragments = [
    `fragment FullPost on Post { id author title ups downs percentageUp isPublished createdAt }`
]

const createPosts = async () => {
    const logContent = 'createPost response: '

    await runQuery(getCreatePostsQuery(
        "snvishna", "test", 157, 10, 97.4, true
    ), logContent)
    await runQuery(getCreatePostsQuery(
        "snvishna", "test title", 60, 30, 21.0, false
    ), logContent)
    await runQuery(getCreatePostsQuery(
        "shankar", "test title", 160, 30, 97.6, false
    ), logContent)
    await runQuery(getCreatePostsQuery(
        "snvishna", "test TITLE", 170, 30, 88.8, true
    ), logContent)
    await runQuery(getCreatePostsQuery(
        "snvishna", "test title", 200, 50, 11.9, false
    ), logContent)
    await runQuery(getCreatePostsQuery(
        "snvishna", "test title", 170, 30, 88.8, true
    ), logContent)
    await runQuery(getCreatePostsQuery(
        "snvishna", "test title", 160, 30, 97.6, false
    ), logContent)
    await runQuery(getCreatePostsQuery(
        "snvishna", "test title", 170, 30, 77.7, true
    ), logContent)

    // Waiting for the ES Cluster + Streaming Lambda infra to be setup
    console.log('Waiting for the ES Cluster + Streaming Lambda infra to be setup')
    await cf.wait(120, () => Promise.resolve())
}

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
}

let GRAPHQL_CLIENT = undefined;

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
    `
    const transformer = new GraphQLTransform({
        transformers: [
            new DynamoDBModelTransformer(),
            new ModelAuthTransformer(),
            new SearchableModelTransformer()
        ]
    })
    try {
        await awsS3Client.createBucket({Bucket: BUCKET_NAME}).promise()
    } catch (e) {
        console.error(`Failed to create bucket: ${e}`)
    }
    try {
        const out = transformer.transform(validSchema);
        // fs.writeFileSync('./out.json', JSON.stringify(out, null, 4))
        // create stack with additional params
        // const additionalParams = generateParams()
        console.log('Creating Stack ' + STACK_NAME)
        const finishedStack = await deploy(
            customS3Client, cf, STACK_NAME, out, {}, LOCAL_FS_BUILD_DIR, BUCKET_NAME, S3_ROOT_DIR_KEY,
            BUILD_TIMESTAMP
        )
        // Arbitrary wait to make sure everything is ready.
        await cf.wait(120, () => Promise.resolve())
        console.log('Successfully created stack ' + STACK_NAME)
        expect(finishedStack).toBeDefined()
        const getApiEndpoint = outputValueSelector(ResourceConstants.OUTPUTS.GraphQLAPIEndpointOutput)
        const getApiKey = outputValueSelector(ResourceConstants.OUTPUTS.GraphQLAPIApiKeyOutput)
        const endpoint = getApiEndpoint(finishedStack.Outputs)
        const apiKey = getApiKey(finishedStack.Outputs)
        expect(apiKey).toBeDefined()
        expect(endpoint).toBeDefined()
        GRAPHQL_CLIENT = new GraphQLClient(endpoint, { 'x-api-key': apiKey })

        // Create sample mutations to test search queries
        await createPosts();
    } catch (e) {
        console.error(e)
        expect(true).toEqual(false)
    }
});

afterAll(async () => {
    try {
        console.log('Deleting stack ' + STACK_NAME)
        await cf.deleteStack(STACK_NAME)
        await cf.waitForStack(STACK_NAME)
        console.log('Successfully deleted stack ' + STACK_NAME)
    } catch (e) {
        if (e.code === 'ValidationError' && e.message === `Stack with id ${STACK_NAME} does not exist`) {
            // The stack was deleted. This is good.
            expect(true).toEqual(true)
            console.log('Successfully deleted stack ' + STACK_NAME)
        } else {
            console.error(e)
            expect(true).toEqual(false)
        }
    }
    try {
        await emptyBucket(BUCKET_NAME);
    } catch (e) {
        console.error(`Failed to empty S3 bucket: ${e}`)
    }
});

test('Test searchPosts with sort field on a string field', async () => {
    const firstQuery = await runQuery(`query {
        searchPosts(sort: {
            field: id
            direction: desc
        }){
            items{
              ...FullPost
            }
            nextToken
          }
    }`, 'Test searchPosts with filter ')
    expect(firstQuery).toBeDefined()
    expect(firstQuery.data.searchPosts).toBeDefined()
    const fourthItemOfFirstQuery = firstQuery.data.searchPosts.items[3]
    const secondQuery = await runQuery(`query {
        searchPosts(limit: 3, sort: {
            field: id
            direction: desc
        }){
            items{
              ...FullPost
            }
            nextToken
          }
    }`, 'Test searchPosts with limit ')
    expect(secondQuery).toBeDefined()
    expect(secondQuery.data.searchPosts).toBeDefined()
    const nextToken = secondQuery.data.searchPosts.nextToken
    expect(nextToken).toBeDefined()
    const thirdQuery = await runQuery(`query {
        searchPosts(nextToken: "${nextToken}", limit: 3, sort: {
            field: id
            direction: desc
        }){
            items{
              ...FullPost
            }
            nextToken
          }
    }`, 'Test searchPosts with sort limit and nextToken  ')
    expect(thirdQuery).toBeDefined()
    expect(thirdQuery.data.searchPosts).toBeDefined()
    const firstItemOfThirdQuery = thirdQuery.data.searchPosts.items[0]
    expect(firstItemOfThirdQuery).toEqual(fourthItemOfFirstQuery)
})

test('Test searchPosts with sort on date type', async () => {
    const query  = await runQuery(`query {
        searchPosts(
            sort: {
                field: createdAt
                direction: desc
            }) {
            items {
                ...FullPost
            }
        }
    }`, 'Test search posts with date type response: ')
    expect(query).toBeDefined()
    expect(query.data.searchPosts).toBeDefined()
    const recentItem = new Date(query.data.searchPosts.items[0].createdAt)
    const oldestItem = new Date(query.data.searchPosts.items[
        query.data.searchPosts.items.length - 1
    ].createdAt)
    expect(recentItem > oldestItem)

})

test('Test searchPosts query without filter', async () => {
    const response = await runQuery(`query {
        searchPosts {
            items { ...FullPost }
        }
    }`, 'Test searchPosts response without filter response: ')
    expect(response).toBeDefined()
    expect(response.data.searchPosts.items).toBeDefined()
    const items = response.data.searchPosts.items
    expect(items.length).toBeGreaterThan(0)
})

test('Test searchPosts query with basic filter', async () => {
    const response = await runQuery(`query {
        searchPosts(filter: {
            author: { eq: "snvishna" }
        }) {
            items { ...FullPost }
        }
    }`, 'Test searchPosts response with basic filter response: ')
    expect(response).toBeDefined()
    expect(response.data.searchPosts.items).toBeDefined()
    const items = response.data.searchPosts.items
    expect(items.length).toEqual(7)
})

test('Test searchPosts query with non-recursive filter', async () => {
    const response = await runQuery(`query {
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
    }`, 'Test searchPosts response with non-recursive filter response: ')
    expect(response).toBeDefined()
    expect(response.data.searchPosts.items).toBeDefined()
    const items = response.data.searchPosts.items
    expect(items.length).toEqual(1)
    expect(items[0].id).toBeDefined()
    expect(items[0].author).toEqual("snvishna")
    expect(items[0].title).toEqual("test title")
    expect(items[0].ups).toEqual(170)
    expect(items[0].downs).toEqual(30)
    expect(items[0].percentageUp).toEqual(88.8)
    expect(items[0].isPublished).toEqual(true)
})

test('Test searchPosts query with recursive filter 1', async () => {
    const response = await runQuery(`query {
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
    }`, 'Test searchPosts response with recursive filter 1 response: ')
    expect(response).toBeDefined()
    expect(response.data.searchPosts.items).toBeDefined()
    const items = response.data.searchPosts.items
    expect(items.length).toEqual(1)
    expect(items[0].id).toBeDefined()
    expect(items[0].author).toEqual("snvishna")
    expect(items[0].title).toEqual("test")
    expect(items[0].ups).toEqual(157)
    expect(items[0].downs).toEqual(10)
    expect(items[0].percentageUp).toEqual(97.4)
    expect(items[0].isPublished).toEqual(true)
})

test('Test searchPosts query with recursive filter 2', async () => {
    const response = await runQuery(`query {
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
    }`, 'Test searchPosts response with recursive filter 2 response: ')
    expect(response).toBeDefined()
    expect(response.data.searchPosts.items).toBeDefined()
    const items = response.data.searchPosts.items
    expect(items.length).toEqual(5)
})

test('Test searchPosts query with recursive filter 3', async () => {
    const response = await runQuery(`query {
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
    }`, 'Test searchPosts query with recursive filter 3 response: ')
    expect(response).toBeDefined()
    expect(response.data.searchPosts.items).toBeDefined()
    const items = response.data.searchPosts.items
    expect(items.length).toEqual(1)
    expect(items[0].id).toBeDefined()
    expect(items[0].author).toEqual("snvishna")
    expect(items[0].title).toEqual("test title")
    expect(items[0].ups).toEqual(200)
    expect(items[0].downs).toEqual(50)
    expect(items[0].percentageUp).toEqual(11.9)
    expect(items[0].isPublished).toEqual(false)
})

test('Test searchPosts query with recursive filter 4', async () => {
    const response = await runQuery(`query {
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
    }`, 'Test searchPosts query with recursive filter 4 response: ')
    expect(response).toBeDefined()
    expect(response.data.searchPosts.items).toBeDefined()
    const items = response.data.searchPosts.items
    expect(items.length).toEqual(1)
    expect(items[0].id).toBeDefined()
    expect(items[0].author).toEqual("snvishna")
    expect(items[0].title).toEqual("test title")
    expect(items[0].ups).toEqual(160)
    expect(items[0].downs).toEqual(30)
    expect(items[0].percentageUp).toEqual(97.6)
    expect(items[0].isPublished).toEqual(false)
})

test('Test searchPosts query with recursive filter 5', async () => {
    const response = await runQuery(`query {
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
    }`, 'Test searchPosts query with recursive filter 5 response: ')
    expect(response).toBeDefined()
    expect(response.data.searchPosts.items).toBeDefined()
    const items = response.data.searchPosts.items
    expect(items.length).toEqual(1)
    expect(items[0].id).toBeDefined()
    expect(items[0].author).toEqual("snvishna")
    expect(items[0].title).toEqual("test title")
    expect(items[0].ups).toEqual(200)
    expect(items[0].downs).toEqual(50)
    expect(items[0].percentageUp).toEqual(11.9)
    expect(items[0].isPublished).toEqual(false)
})

test('Test searchPosts query with recursive filter 6', async () => {
    const response = await runQuery(`query {
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
    }`, 'Test searchPosts query with recursive filter 6 response: ')
    expect(response).toBeDefined()
    expect(response.data.searchPosts.items).toBeDefined()
    const items = response.data.searchPosts.items
    expect(items.length).toEqual(0)
})

test('Test deletePosts syncing with Elasticsearch', async () => {
    // Create Post
    const title = 'to be deleted';
    const postToBeDeletedResponse = await runQuery(getCreatePostsQuery(
        "test author new", title, 1157, 1000, 22.2, true
    ), 'createPost (to be deleted) response: ');
    expect(postToBeDeletedResponse).toBeDefined()
    expect(postToBeDeletedResponse.data.createPost).toBeDefined()
    expect(postToBeDeletedResponse.data.createPost.id).toBeDefined()

    // Wait for the Post to sync to Elasticsearch
    await cf.wait(10, () => Promise.resolve())

    const searchResponse1 = await runQuery(`query {
        searchPosts(filter: {
            title: { eq: "${title}" }
        }) {
            items { ...FullPost }
        }
    }`, 'Test deletePosts syncing with Elasticsearch Search_Before response: ')
    expect(searchResponse1).toBeDefined()
    expect(searchResponse1.data.searchPosts.items).toBeDefined()
    const items1 = searchResponse1.data.searchPosts.items
    expect(items1.length).toEqual(1)
    expect(items1[0].id).toEqual(postToBeDeletedResponse.data.createPost.id)
    expect(items1[0].author).toEqual("test author new")
    expect(items1[0].title).toEqual(title)
    expect(items1[0].ups).toEqual(1157)
    expect(items1[0].downs).toEqual(1000)
    expect(items1[0].percentageUp).toEqual(22.2)
    expect(items1[0].isPublished).toEqual(true)

    const deleteResponse = await runQuery(`mutation {
        deletePost(input: {
            id: "${postToBeDeletedResponse.data.createPost.id}"
        }) {
            ...FullPost
        }
    }`, 'Test deletePosts syncing with Elasticsearch Perform_Delete response: ')
    expect(deleteResponse).toBeDefined()
    expect(deleteResponse.data.deletePost).toBeDefined()
    expect(deleteResponse.data.deletePost.id).toEqual(postToBeDeletedResponse.data.createPost.id)

    // Wait for the Deleted Post to sync to Elasticsearch
    await cf.wait(10, () => Promise.resolve())

    const searchResponse2 = await runQuery(`query {
        searchPosts(filter: {
            title: { eq: "${title}" }
        }) {
            items { ...FullPost }
        }
    }`, 'Test deletePosts syncing with Elasticsearch Search_After response: ')
    expect(searchResponse2).toBeDefined()
    expect(searchResponse2.data.searchPosts.items).toBeDefined()
    const items2 = searchResponse2.data.searchPosts.items
    expect(items2.length).toEqual(0)
})

test('Test updatePost syncing with Elasticsearch', async () => {
    // Create Post
    const author = 'test author update new';
    const title = 'to be updated new';
    const ups = 2157;
    const downs = 2000;
    const percentageUp = 22.2;
    const isPublished = true;

    const postToBeUpdatedResponse = await runQuery(getCreatePostsQuery(
        author, title, ups, downs, percentageUp, isPublished
    ), 'createPost (to be updated) response: ');
    expect(postToBeUpdatedResponse).toBeDefined();
    expect(postToBeUpdatedResponse.data.createPost).toBeDefined();

    const id = postToBeUpdatedResponse.data.createPost.id;
    expect(id).toBeDefined()

    // Wait for the Post to sync to Elasticsearch
    await cf.wait(10, () => Promise.resolve())

    const searchResponse1 = await runQuery(`query {
        searchPosts(filter: {
            id: { eq: "${id}" }
        }) {
            items { ...FullPost }
        }
    }`, 'Test updatePost syncing with Elasticsearch Search_Before response: ')
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
    const updateResponse = await runQuery(`mutation {
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
    }`, 'Test updatePost syncing with Elasticsearch Perform_Update response: ')
    expect(updateResponse).toBeDefined()
    expect(updateResponse.data.updatePost).toBeDefined()
    expect(updateResponse.data.updatePost.id).toEqual(id)
    expect(updateResponse.data.updatePost.title).toEqual(newTitle)

    // Wait for the Update Post to sync to Elasticsearch
    await cf.wait(10, () => Promise.resolve())

    const searchResponse2 = await runQuery(`query {
        searchPosts(filter: {
            id: { eq: "${id}" }
        }) {
            items { ...FullPost }
        }
    }`, 'Test updatePost syncing with Elasticsearch Search_After response: ')
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
})

function generateParams() {
    const params = {
        [ResourceConstants.PARAMETERS.ElasticsearchAccessIAMRoleName]: 'ElasticsearchAccessIAMRoleTest',
        [ResourceConstants.PARAMETERS.ElasticsearchStreamingIAMRoleName]: 'ElasticsearchStreamingIAMRoleTest'
    }

    return params
}

function getCreatePostsQuery(
    author: string,
    title: string,
    ups: number,
    downs: number,
    percentageUp: number,
    isPublished: boolean
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
    }`
}

function outputValueSelector(key: string) {
    return (outputs: Output[]) => {
        const output = outputs.find((o: Output) => o.OutputKey === key)
        return output ? output.OutputValue : null
    }
}
