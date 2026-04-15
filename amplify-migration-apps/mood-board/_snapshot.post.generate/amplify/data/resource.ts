import { defineData } from '@aws-amplify/backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';
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
  getRandomEmoji: String @function(name: "moodboardGetRandomEmoji-${branchName}") @auth(rules: [{ allow: private }])
  getKinesisEvents: AWSJSON @function(name: "moodboardKinesisReader-${branchName}") @auth(rules: [{ allow: private }])
}
`;

export const data = defineData({
  migratedAmplifyGen1DynamoDbTableMappings: [
    {
      //The "branchname" variable needs to be the same as your deployment branch if you want to reuse your Gen1 app tables
      branchName: 'x',
      modelNameToTableNameMapping: {
        MoodItem: 'MoodItem-kuwr5auj4zbxdhbslpanljzbwi-x',
        Board: 'Board-kuwr5auj4zbxdhbslpanljzbwi-x',
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
