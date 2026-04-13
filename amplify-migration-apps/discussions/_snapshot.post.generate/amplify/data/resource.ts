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
  fetchUserActivity(storage.activity.SortKeyName: ID!): [Activity] @function(name: "fetchuseractivity-${da5e56ee3d.deploymentTypeName}") @auth(rules: [{ allow: public }])
}

type Activity {
  id: ID! @auth(rules: [{ allow: public }])
  storage.activity.SortKeyName: ID! @auth(rules: [{ allow: public }])
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
        Topic: 'e9a3818d7e.GetAtte9a3818d7e.amplifydiscussionsgen2mainda5e56ee3d.deploymentTypea27e51c30adataamplifyDataTopicTopicDataSource5289BBFCNameName',
        Post: 'd7cb664f4a.GetAttd7cb664f4a.amplifydiscussionsgen2mainda5e56ee3d.deploymentTypea27e51c30adataamplifyDataPostPostDataSource1181B975NameName',
        Comment: '89544babf0.GetAtt89544babf0.amplifydiscussionsgen2mainda5e56ee3d.deploymentTypea27e51c30adataamplifyDataCommentCommentDataSource55E61D91NameName',
      },
    },
  ],
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: { expiresInDays: 7 },
  },
  schema,
});
