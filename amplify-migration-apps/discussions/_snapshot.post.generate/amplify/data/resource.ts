import { defineData } from '@aws-amplify/backend';
import type { Backend } from '../backend';

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
  getActivityStats: ActivityStats @function(name: "fetchuseractivity-${branchName}") @auth(rules: [{ allow: public }])
}

type ActivityStats {
  activityCount: Int! @auth(rules: [{ allow: public }])
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
      //The "branchName" variable needs to be the same as your deployment branch if you want to reuse your Gen1 app tables
      branchName: 'x',
      modelNameToTableNameMapping: {
        Topic: 'Topic-ofxtncx3vjdyxe6g4bijjb7jie-x',
        Post: 'Post-ofxtncx3vjdyxe6g4bijjb7jie-x',
        Comment: 'Comment-ofxtncx3vjdyxe6g4bijjb7jie-x',
      },
    },
  ],
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: { expiresInDays: 7 },
  },
  schema,
});
