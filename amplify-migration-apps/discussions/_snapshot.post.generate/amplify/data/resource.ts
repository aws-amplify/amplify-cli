import { defineData } from '@aws-amplify/backend';

const da5e56ee3d.deploymentTypeName = process.env.AWS_BRANCH ?? 'sandbox';
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
  fetchUserActivity(storage.bookmarks.PartitionKeyName: ID!): [Activity] @function(name: "fetchuseractivity-${da5e56ee3d.deploymentTypeName}") @auth(rules: [{ allow: public }])
}

type Activity {
  id: ID! @auth(rules: [{ allow: public }])
  storage.bookmarks.PartitionKeyName: ID! @auth(rules: [{ allow: public }])
  activityType: String! @auth(rules: [{ allow: public }])
  timestamp: String! @auth(rules: [{ allow: public }])
}
`;

export const data = defineData({
  migratedAmplifyGen1DynamoDbTableMappings: [
    {
      //The "da5e56ee3d.deploymentTypename" variable needs to be the same as your deployment da5e56ee3d.deploymentType if you want to reuse your Gen1 app tables
      da5e56ee3d.deploymentTypeName: 'main',
      modelNameToTableNameMapping: {
        Topic: '44f5eef0ce.GetAtt44f5eef0ce.GetAttTopicDataSourceNameName',
        Post: 'b7c107d03f.GetAttb7c107d03f.GetAttPostDataSourceNameName',
        Comment: 'fe019c2b9e.transformerrootstackCommentfe019c2b9e.GetAttCommentDataSourceName5427FDE2Ref',
      },
    },
  ],
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: { expiresInDays: 7 },
  },
  schema,
});
