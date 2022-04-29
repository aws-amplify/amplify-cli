import { MapsToTransformer } from '@aws-amplify/graphql-maps-to-transformer';
import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { BelongsToTransformer, HasManyTransformer } from '@aws-amplify/graphql-relational-transformer';
import { GraphQLTransform } from '@aws-amplify/graphql-transformer-core';
import { getSchemaDeployer, SchemaDeployer } from '../deploySchema';

describe('@mapsTo transformer', () => {
  jest.setTimeout(1000 * 60 * 15); // 15 minutes
  const transformerFactory = () =>
    new GraphQLTransform({
      transformers: [new ModelTransformer(), new HasManyTransformer(), new BelongsToTransformer(), new MapsToTransformer()],
      sandboxModeEnabled: true,
    });

  const initialSchema = /* GraphQL */ `
    type Post @model {
      id: ID!
      title: String!
      comments: [Comment] @hasMany
    }

    type Comment @model {
      id: ID!
      message: String!
      post: Post @belongsTo
    }
  `;

  const updatedSchema = /* GraphQL */ `
    type Article @model @mapsTo(name: "Post") {
      id: ID!
      title: String!
      comments: [Comment] @hasMany
    }

    type Comment @model {
      id: ID
      message: String!
      post: Article @belongsTo
    }
  `;

  let testSchemaDeployer: SchemaDeployer;
  beforeEach(async () => {
    testSchemaDeployer = await getSchemaDeployer('mapsToTest', transformerFactory);
  });

  afterEach(async () => {
    await testSchemaDeployer?.cleanup();
  });

  it('maps all renamed foreign keys in input and response', async () => {
    // setup initial API
    let graphqlClient = await testSchemaDeployer.deploy(initialSchema);
    // insert records with initial schema
    const createInitialPostsAndComments = /* GraphQL */ `
      mutation MyMutation {
        createPost1: createPost(input: { id: "post1", title: "test post 1" }) {
          id
        }
        createComment1: createComment(input: { message: "test comment 1", postCommentsId: "post1", id: "comment1" }) {
          id
        }
        createPost2: createPost(input: { id: "post2", title: "test post 2" }) {
          id
        }
        createComment2: createComment(input: { message: "test comment 2", postCommentsId: "post2", id: "comment2" }) {
          id
        }
      }
    `;
    const initialResponse = await graphqlClient.query(createInitialPostsAndComments);
    expect(initialResponse.errors).toBeUndefined();

    // update schema to rename Post => Article
    graphqlClient = await testSchemaDeployer.deploy(updatedSchema);

    // expect listing articles to get existing posts with comments
    const listArticles = /* GraphQL */ `
      query MyQuery {
        listArticles {
          items {
            id
            title
            comments {
              items {
                id
                message
                articleCommentsId
              }
            }
          }
        }
      }
    `;

    const listArticlesResponse = await graphqlClient.query(listArticles);
    expect(listArticlesResponse.errors).toBeUndefined();
    expect(listArticlesResponse.data).toMatchInlineSnapshot(`
      Object {
        "listArticles": Object {
          "items": Array [
            Object {
              "comments": Object {
                "items": Array [
                  Object {
                    "articleCommentsId": "post1",
                    "id": "comment1",
                    "message": "test comment 1",
                  },
                ],
              },
              "id": "post1",
              "title": "test post 1",
            },
            Object {
              "comments": Object {
                "items": Array [
                  Object {
                    "articleCommentsId": "post2",
                    "id": "comment2",
                    "message": "test comment 2",
                  },
                ],
              },
              "id": "post2",
              "title": "test post 2",
            },
          ],
        },
      }
    `);

    // expect filtering comments by article id to work
    const filterCommentsByArticle = /* GraphQL */ `
      query MyQuery {
        listComments(filter: { articleCommentsId: { eq: "post2" } }) {
          items {
            id
            message
            articleCommentsId
          }
        }
      }
    `;

    const filteredCommentsResponse = await graphqlClient.query(filterCommentsByArticle);
    expect(filteredCommentsResponse.errors).toBeUndefined();
    expect(filteredCommentsResponse.data).toMatchInlineSnapshot(`
      Object {
        "listComments": Object {
          "items": Array [
            Object {
              "articleCommentsId": "post2",
              "id": "comment2",
              "message": "test comment 2",
            },
          ],
        },
      }
    `);

    // expect creating new comment on existing post (article) to work
    const createCommentOnPost1 = /* GraphQL */ `
      mutation MyMutation {
        createComment(input: { articleCommentsId: "post1", id: "comment3", message: "test comment 3" }) {
          id
        }
      }
    `;
    const createCommentOnPost1Response = await graphqlClient.query(createCommentOnPost1);
    expect(createCommentOnPost1Response.errors).toBeUndefined();

    const getPost1Comments = /* GraphQL */ `
      query MyQuery {
        getArticle(id: "post1") {
          comments {
            items {
              id
            }
          }
        }
      }
    `;

    const getPost1CommentsResponse = await graphqlClient.query(getPost1Comments);
    expect(getPost1CommentsResponse.errors).toBeUndefined();
    expect((getPost1CommentsResponse.data.getArticle.comments.items as any[]).map(item => item.id).includes('comment3'));

    // expect updating comment with unsatisfied condition expression to fail
    const updateCommentUnsatisfiedCondition = /* GraphQL */ `
      mutation MyMutation {
        updateComment(
          input: { id: "comment2", articleCommentsId: "post1", message: "moved comment2 from post2 to post1" }
          condition: { articleCommentsId: { eq: "thisIsWrong" } }
        ) {
          id
        }
      }
    `;
    const updateCommentUnsatisfiedConditionResponse = await graphqlClient.query(updateCommentUnsatisfiedCondition);
    expect((updateCommentUnsatisfiedConditionResponse.errors[0] as any).errorType).toEqual('DynamoDB:ConditionalCheckFailedException');

    // expect updating comment with satisfied condition expression to work
    const updateCommentSatisfiedCondition = /* GraphQL */ `
      mutation MyMutation {
        updateComment(
          input: { id: "comment2", articleCommentsId: "post1", message: "moved comment2 from post2 to post1" }
          condition: { articleCommentsId: { eq: "post2" } }
        ) {
          id
          articleCommentsId
          message
        }
      }
    `;
    const updateCommentSatisfiedConditionResponse = await graphqlClient.query(updateCommentSatisfiedCondition);
    expect(updateCommentSatisfiedConditionResponse.errors).toBeUndefined();
    expect(updateCommentSatisfiedConditionResponse.data).toMatchInlineSnapshot(`
      Object {
        "updateComment": Object {
          "articleCommentsId": "post1",
          "id": "comment2",
          "message": "moved comment2 from post2 to post1",
        },
      }
    `);

    // expect creating new article and comment to work
    const createNewArticleAndComment = /* GraphQL */ `
      mutation MyMutation {
        createArticle(input: { id: "article3", title: "article 3 title" }) {
          id
          title
        }
        createComment(input: { articleCommentsId: "article3", id: "comment4", message: "test comment 4" }) {
          articleCommentsId
          id
          message
        }
      }
    `;
    const createNewArticleAndCommentResponse = await graphqlClient.query(createNewArticleAndComment);
    expect(createNewArticleAndCommentResponse.errors).toBeUndefined();

    // expect listing articles to get articles with comments created before and after remapping
    const listArticlesResponse2 = await graphqlClient.query(listArticles);
    expect(listArticlesResponse2.errors).toBeUndefined();
    expect(listArticlesResponse2.data).toMatchInlineSnapshot(`
      Object {
        "listArticles": Object {
          "items": Array [
            Object {
              "comments": Object {
                "items": Array [
                  Object {
                    "articleCommentsId": "post1",
                    "id": "comment1",
                    "message": "test comment 1",
                  },
                  Object {
                    "articleCommentsId": "post1",
                    "id": "comment2",
                    "message": "moved comment2 from post2 to post1",
                  },
                  Object {
                    "articleCommentsId": "post1",
                    "id": "comment3",
                    "message": "test comment 3",
                  },
                ],
              },
              "id": "post1",
              "title": "test post 1",
            },
            Object {
              "comments": Object {
                "items": Array [
                  Object {
                    "articleCommentsId": "article3",
                    "id": "comment4",
                    "message": "test comment 4",
                  },
                ],
              },
              "id": "article3",
              "title": "article 3 title",
            },
            Object {
              "comments": Object {
                "items": Array [],
              },
              "id": "post2",
              "title": "test post 2",
            },
          ],
        },
      }
    `);

    // expect filtering comments by article id to get comments created before and after remapping
    const nestedFilterComments = /* GraphQL */ `
      query MyQuery {
        listComments(
          filter: {
            or: [
              { articleCommentsId: { eq: "article3" } }
              { and: [{ articleCommentsId: { beginsWith: "post" } }, { id: { eq: "comment1" } }] }
            ]
          }
        ) {
          items {
            id
            message
            articleCommentsId
          }
        }
      }
    `;

    const nestedFilterCommentsResponse = await graphqlClient.query(nestedFilterComments);
    expect(nestedFilterCommentsResponse.errors).toBeUndefined();
    expect(nestedFilterCommentsResponse.data).toMatchInlineSnapshot(`
      Object {
        "listComments": Object {
          "items": Array [
            Object {
              "articleCommentsId": "post1",
              "id": "comment1",
              "message": "test comment 1",
            },
            Object {
              "articleCommentsId": "article3",
              "id": "comment4",
              "message": "test comment 4",
            },
          ],
        },
      }
    `);
  });
});
