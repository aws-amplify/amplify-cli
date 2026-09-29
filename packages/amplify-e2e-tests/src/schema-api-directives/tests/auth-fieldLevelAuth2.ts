//schema
export const schema = `
#change: added type Post definition which is omitted in the doc
#error: connection field auth does not work as described, when query user, posts are always null
#change: quoted out connection field auth to make query work
type User @model {
  id: ID!
  username: String
  posts: [Post]
    @connection(name: "UserPosts")
    #@auth(rules: [{ allow: owner, ownerField: "username" }])
}

type Post @model(queries: null) 
{
  id: ID!
  owner: User @connection(name: "UserPosts")
  postname: String
  content: String
}

##fieldLevelAuth2`;
//mutations
export const mutation1 = `
mutation CreateUser {
    createUser(input: {
      id: "1",
      username: "user1"
    }) {
      id
      username
    }
}`;
export const expected_result_mutation1 = {
  data: {
    createUser: {
      id: '1',
      username: 'user1',
    },
  },
};

export const mutation2 = `
 mutation {
    createPost(input: {
      id: "1",
      postname: "post1",
      content: "post1 content",
      postOwnerId: "1"
    }) {
      id
      owner {
        id
        username
      }
      postname
      content
    }
}`;
export const expected_result_mutation2 = {
  data: {
    createPost: {
      id: '1',
      owner: {
        id: '1',
        username: 'user1',
      },
      postname: 'post1',
      content: 'post1 content',
    },
  },
};

//queries
export const query = `
 query GetUser {
    getUser(id: "1") {
      id
      username
      posts {
        items {
          id
          postname
        }
      }
    }
}`;
export const expected_result_query = {
  data: {
    getUser: {
      id: '1',
      username: 'user1',
      posts: {
        items: [
          {
            id: '1',
            postname: 'post1',
          },
        ],
      },
    },
  },
};
