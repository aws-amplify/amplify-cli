//schema
export const schema = `
type Post @model {
  id: ID!
  title: String!
  comments: [Comment] @connection(keyName: "byPost", fields: ["id"])
}

type Comment @model 
  @key(name: "byPost", fields: ["postID", "content"]) {
  id: ID!
  postID: ID!
  content: String!
  post: Post @connection(fields: ["postID"])
}

##connection/belongsTo`;
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
mutation CreateCommentOnPost1 {
  createComment(input: { id: "a-comment-id-1", content: "A comment #1", postID: "a-post-id" }) {
    id
    content
  }
}`;
export const expected_result_mutation2 = {
  data: {
    createComment: {
      id: 'a-comment-id-1',
      content: 'A comment #1',
    },
  },
};

export const mutation3 = `
mutation CreateCommentOnPost2 {
  createComment(input: { id: "a-comment-id-2", content: "A comment #2", postID: "a-post-id" }) {
    id
    content
  }
}
`;
export const expected_result_mutation3 = {
  data: {
    createComment: {
      id: 'a-comment-id-2',
      content: 'A comment #2',
    },
  },
};

//queries
export const query = `
query GetCommentWithPostAndComments {
  getComment(id: "a-comment-id-1") {
    id
    content
    post {
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
}
`;
export const expected_result_query = {
  data: {
    getComment: {
      id: 'a-comment-id-1',
      content: 'A comment #1',
      post: {
        id: 'a-post-id',
        title: 'Post Title',
        comments: {
          items: [
            {
              id: 'a-comment-id-1',
              content: 'A comment #1',
            },
            {
              id: 'a-comment-id-2',
              content: 'A comment #2',
            },
          ],
        },
      },
    },
  },
};
