//schema
const env = '${env}';
export const schema = `
#change: replaced "GraphQLResolverFunction" with the "<function-name>" placeholder, the test will replace it with the actual function name
type Query {
  posts: [Post] @function(name: "<function-name>-${env}")
}
type Post {
  id: ID!
  title: String!
  comments: [Comment] @function(name: "<function-name>-${env}")
}
type Comment {
  postId: ID!
  content: String
}
`;
//functions
export const func = `
const POSTS = [
  { id: 1, title: 'AWS Lambda: How To Guide.' },
  { id: 2, title: 'AWS Amplify Launches @function and @key directives.' },
  { id: 3, title: 'Serverless 101' },
];
const COMMENTS = [
  { postId: 1, content: 'Great guide!' },
  { postId: 1, content: 'Thanks for sharing!' },
  { postId: 2, content: "Can't wait to try them out!" },
];

// Get all posts. Write your own logic that reads from any data source.
function getPosts() {
  return POSTS;
}

// Get the comments for a single post.
function getCommentsForPost(postId) {
  return COMMENTS.filter(comment => comment.postId === postId);
}

/**
 * Using this as the entry point, you can use a single function to handle many resolvers.
 */
const resolvers = {
  Query: {
    posts: ctx => {
      return getPosts();
    },
  },
  Post: {
    comments: ctx => {
      return getCommentsForPost(ctx.source.id);
    },
  },
};

// event
// {
//   "typeName": "Query", /* Filled dynamically based on @function usage location */
//   "fieldName": "me", /* Filled dynamically based on @function usage location */
//   "arguments": { /* GraphQL field arguments via $ctx.arguments */ },
//   "identity": { /* AppSync identity object via $ctx.identity */ },
//   "source": { /* The object returned by the parent resolver. E.G. if resolving field 'Post.comments', the source is the Post object. */ },
//   "request": { /* AppSync request object. Contains things like headers. */ },
//   "prev": { /* If using the built-in pipeline resolver support, this contains the object returned by the previous function. */ },
// }
exports.handler = async event => {
  const typeHandler = resolvers[event.typeName];
  if (typeHandler) {
    const resolver = typeHandler[event.fieldName];
    if (resolver) {
      return await resolver(event);
    }
  }
  throw new Error('Resolver not found.');
};
`;

//queries
export const query = `
#extra
query Posts {
  posts {
    id
    title
    comments {
      postId
      content
    }
  }
}
`;
export const expected_result_query = {
  data: {
    posts: [
      {
        id: '1',
        title: 'AWS Lambda: How To Guide.',
        comments: [
          {
            postId: '1',
            content: 'Great guide!',
          },
          {
            postId: '1',
            content: 'Thanks for sharing!',
          },
        ],
      },
      {
        id: '2',
        title: 'AWS Amplify Launches @function and @key directives.',
        comments: [
          {
            postId: '2',
            content: "Can't wait to try them out!",
          },
        ],
      },
      {
        id: '3',
        title: 'Serverless 101',
        comments: [],
      },
    ],
  },
};
