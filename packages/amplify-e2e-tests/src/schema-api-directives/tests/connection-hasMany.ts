//schema
export const schema = `
type Post @model {
  id: ID!
  title: String!
  comments: [Comment] @connection(keyName: "byPost", fields: ["id"])
}

type Comment @model @key(name: "byPost", fields: ["postID", "content"]) {
  id: ID!
  postID: ID!
  content: String!
}

##connection/hasMany`;
//mutations
export const mutation1 = `
mutation CreatePost {
  createPost(input: { id: "a-post-id", title: "Post Title" }) {
    id
    title
  }
}`;
export const expected_result_mutation1 = {
  data: {
    createPost: {
      id: 'a-post-id',
      title: 'Post Title',
    },
  },
};

export const mutation2 = `
mutation CreateCommentOnPost {
  createComment(input: { id: "a-comment-id", content: "A comment", postID: "a-post-id" }) {
    id
    content
  }
}
`;
export const expected_result_mutation2 = {
  data: {
    createComment: {
      id: 'a-comment-id',
      content: 'A comment',
    },
  },
};

//queries
export const query = `
query getPost {
  getPost(id: "a-post-id") {
    id
    title
    comments {
      items {
        id
        content
      }
    }
  }
}
`;
export const expected_result_query = {
  data: {
    getPost: {
      id: 'a-post-id',
      title: 'Post Title',
      comments: {
        items: [
          {
            id: 'a-comment-id',
            content: 'A comment',
          },
        ],
      },
    },
  },
};
