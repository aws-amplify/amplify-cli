import { defineData } from '@aws-amplify/backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';
const schema = `type Topic @model @auth(rules: [{ allow: public }]){
  id: ID!
  createdByUserId: String!
  content: String!
  posts: [Post] @hasMany
}

type Post @model @auth(rules: [{ allow: public }]){
  id: ID!
  createdByUserId: String!
  content: String!
  comments: [Comment] @hasMany
  topic: Topic @belongsTo
}

type Comment @model @auth(rules: [{ allow: public }]){
  id: ID!
  createdByUserId: String!
  content: String!
  post: Post @belongsTo
}

type Query {
  fetchUserActivity(userId: ID!): [Activity] @function(name: "fetchuseractivity-${branchName}") @auth(rules: [{ allow: public }])
}

type Activity {
  id: ID! @auth(rules: [{ allow: public }])
  userId: ID! @auth(rules: [{ allow: public }])
  activityType: String! @auth(rules: [{ allow: public }])
  timestamp: String! @auth(rules: [{ allow: public }])
}
`;

export const data = defineData({
  migratedAmplifyGen1DynamoDbTableMappings: [
    {
      //The "branchname" variable needs to be the same as your deployment branch if you want to reuse your Gen1 app tables
      branchName: 'maintwo',
      modelNameToTableNameMapping: {
        Topic: 'Topic-st35wex2drhe5piowtinjea47y-maintwo',
        Post: 'Post-st35wex2drhe5piowtinjea47y-maintwo',
        Comment: 'Comment-st35wex2drhe5piowtinjea47y-maintwo',
      },
    },
  ],
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: { expiresInDays: 7 },
  },
  schema,
});
