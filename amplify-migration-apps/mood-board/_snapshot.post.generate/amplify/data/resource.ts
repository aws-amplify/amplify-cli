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
        MoodItem: '79926af416.GetAtt79926af416.amplifymoodboardgen2main383edf5091.deploymentTypef7e4caeabbdataamplifyDataMoodItemMoodItemDataSource2ACD4FADNameName',
        Board: '0ccbfc84ee.GetAtt0ccbfc84ee.amplifymoodboardgen2main383edf5091.deploymentTypef7e4caeabbdataamplifyDataBoardBoardDataSource3085F3C2NameName',
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
