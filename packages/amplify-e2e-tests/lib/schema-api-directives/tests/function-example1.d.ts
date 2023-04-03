export declare const schema: string;
export declare const func = "\nconst POSTS = [\n  { id: 1, title: 'AWS Lambda: How To Guide.' },\n  { id: 2, title: 'AWS Amplify Launches @function and @key directives.' },\n  { id: 3, title: 'Serverless 101' },\n];\nconst COMMENTS = [\n  { postId: 1, content: 'Great guide!' },\n  { postId: 1, content: 'Thanks for sharing!' },\n  { postId: 2, content: \"Can't wait to try them out!\" },\n];\n\n// Get all posts. Write your own logic that reads from any data source.\nfunction getPosts() {\n  return POSTS;\n}\n\n// Get the comments for a single post.\nfunction getCommentsForPost(postId) {\n  return COMMENTS.filter(comment => comment.postId === postId);\n}\n\n/**\n * Using this as the entry point, you can use a single function to handle many resolvers.\n */\nconst resolvers = {\n  Query: {\n    posts: ctx => {\n      return getPosts();\n    },\n  },\n  Post: {\n    comments: ctx => {\n      return getCommentsForPost(ctx.source.id);\n    },\n  },\n};\n\n// event\n// {\n//   \"typeName\": \"Query\", /* Filled dynamically based on @function usage location */\n//   \"fieldName\": \"me\", /* Filled dynamically based on @function usage location */\n//   \"arguments\": { /* GraphQL field arguments via $ctx.arguments */ },\n//   \"identity\": { /* AppSync identity object via $ctx.identity */ },\n//   \"source\": { /* The object returned by the parent resolver. E.G. if resolving field 'Post.comments', the source is the Post object. */ },\n//   \"request\": { /* AppSync request object. Contains things like headers. */ },\n//   \"prev\": { /* If using the built-in pipeline resolver support, this contains the object returned by the previous function. */ },\n// }\nexports.handler = async event => {\n  const typeHandler = resolvers[event.typeName];\n  if (typeHandler) {\n    const resolver = typeHandler[event.fieldName];\n    if (resolver) {\n      return await resolver(event);\n    }\n  }\n  throw new Error('Resolver not found.');\n};\n";
export declare const query = "\n#extra\nquery Posts {\n  posts {\n    id\n    title\n    comments {\n      postId\n      content\n    }\n  }\n}\n";
export declare const expected_result_query: {
    data: {
        posts: {
            id: string;
            title: string;
            comments: {
                postId: string;
                content: string;
            }[];
        }[];
    };
};
