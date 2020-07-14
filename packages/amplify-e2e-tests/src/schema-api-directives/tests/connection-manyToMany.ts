//schema
export const schema = `
type Post @model {
  id: ID!
  title: String!
  editors: [PostEditor] @connection(keyName: "byPost", fields: ["id"])
}

# Create a join model and disable queries as you don't need them
# and can query through Post.editors and User.posts
type PostEditor
  @model(queries: null)
  @key(name: "byPost", fields: ["postID", "editorID"])
  @key(name: "byEditor", fields: ["editorID", "postID"]) {
  id: ID!
  postID: ID!
  editorID: ID!
  post: Post! @connection(fields: ["postID"])
  editor: User! @connection(fields: ["editorID"])
}

type User @model {
  id: ID!
  username: String!
  posts: [PostEditor] @connection(keyName: "byEditor", fields: ["id"])
}

##connection/manyToMany`;
//mutations
export const mutation1 = `
mutation CreateData {
  p1: createPost(input: { id: "P1", title: "Post 1" }) {
    id
  }
  p2: createPost(input: { id: "P2", title: "Post 2" }) {
    id
  }
  u1: createUser(input: { id: "U1", username: "user1" }) {
    id
  }
  u2: createUser(input: { id: "U2", username: "user2" }) {
    id
  }
}
`;

export const mutation2 = `
mutation CreateLinks {
  p1u1: createPostEditor(input: { id: "P1U1", postID: "P1", editorID: "U1" }) {
    id
  }
  p1u2: createPostEditor(input: { id: "P1U2", postID: "P1", editorID: "U2" }) {
    id
  }
  p2u1: createPostEditor(input: { id: "P2U1", postID: "P2", editorID: "U1" }) {
    id
  }
}
`;

//queries
export const query1 = `
query GetUserWithPosts {
  getUser(id: "U1") {
    id
    username
    posts {
      items {
        post {
          title
        }
      }
    }
  }
}
`;
export const expected_result_query1 = {
  data: {
    getUser: {
      id: 'U1',
      username: 'user1',
      posts: {
        items: [
          {
            post: {
              title: 'Post 1',
            },
          },
          {
            post: {
              title: 'Post 2',
            },
          },
        ],
      },
    },
  },
};

export const query2 = `
query GetPostWithEditorsWithPosts {
  getPost(id: "P1") {
    id
    title
    editors {
      items {
        editor {
          username
          posts {
            items {
              post {
                title
              }
            }
          }
        }
      }
    }
  }
}
`;
export const expected_result_query2 = {
  data: {
    getPost: {
      id: 'P1',
      title: 'Post 1',
      editors: {
        items: [
          {
            editor: {
              username: 'user1',
              posts: {
                items: [
                  {
                    post: {
                      title: 'Post 1',
                    },
                  },
                  {
                    post: {
                      title: 'Post 2',
                    },
                  },
                ],
              },
            },
          },
          {
            editor: {
              username: 'user2',
              posts: {
                items: [
                  {
                    post: {
                      title: 'Post 1',
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    },
  },
};
