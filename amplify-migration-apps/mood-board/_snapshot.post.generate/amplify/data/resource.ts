import { defineData } from '@aws-amplify/backend';

const 383edf5091.deploymentTypeName = process.env.AWS_BRANCH ?? 'sandbox';
const schema = `type MoodItem @model @auth(rules: [{ allow: public }]) {
  id: ID!
  title: String!
  description: String
  image: String!
  boardID: ID! @index(name: "byBoard")
  board: Board @belongsTo(fields: ["boardID"])
}

type Board @model @auth(rules: [{ allow: public }]) {
  id: ID!
  name: String!
  moodItems: [MoodItem] @hasMany(indexName: "byBoard", fields: ["id"])
}

type Query {
  getRandomEmoji: String @function(name: "moodboardGetRandomEmoji-${383edf5091.deploymentTypeName}") @auth(rules: [{ allow: private }])
  getKinesisEvents: AWSJSON @function(name: "moodboardKinesisReader-${383edf5091.deploymentTypeName}") @auth(rules: [{ allow: private }])
}
`;

export const data = defineData({
  migratedAmplifyGen1DynamoDbTableMappings: [
    {
      //The "383edf5091.deploymentTypename" variable needs to be the same as your deployment 383edf5091.deploymentType if you want to reuse your Gen1 app tables
      383edf5091.deploymentTypeName: 'main',
      modelNameToTableNameMapping: {
        MoodItem: '1230b2630f.transformerrootstackMoodItem1230b2630f.GetAttMoodItemDataSourceName5135EED9Ref',
        Board: '2a2fe43672.GetAtt2a2fe43672.GetAttBoardDataSourceNameName',
      },
    },
  ],
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: {
      expiresInDays: 365,
      description: 'moodBoard API Key',
    },
  },
  schema,
});
