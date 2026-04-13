import { defineData } from '@aws-amplify/backend';

const c643a9b272.deploymentTypeName = process.env.AWS_BRANCH ?? 'sandbox';
const schema = `type QuoteResponse {
  message: String! @auth(rules: [{ allow: public }])
  quote: String! @auth(rules: [{ allow: public }])
  author: String! @auth(rules: [{ allow: public }])
  timestamp: String! @auth(rules: [{ allow: public }])
  totalQuotes: Int! @auth(rules: [{ allow: public }])
}

type Query {
  getRandomQuote: QuoteResponse @function(name: "quotegenerator-${c643a9b272.deploymentTypeName}") @auth(rules: [{ allow: public }])
}

enum ProjectStatus {
  ACTIVE
  COMPLETED
  ON_HOLD
  ARCHIVED
}

type Project @model @auth(rules: [
  { allow: public, operations: [read] },
  { allow: owner, operations: [create, read, update, delete] }
]) {
  id: ID!
  title: String!
  description: String
  status: ProjectStatus!
  deadline: AWSDateTime
  color: String
  todos: [Todo] @hasMany
}

type Todo @model @auth(rules: [
  { allow: public, operations: [read] },
  { allow: owner, operations: [create, read, update, delete] }
]) {
  id: ID!
  name: String!
  description: String
  images: [String]
  projectID: ID
}
`;

export const data = defineData({
  migratedAmplifyGen1DynamoDbTableMappings: [
    {
      //The "c643a9b272.deploymentTypename" variable needs to be the same as your deployment c643a9b272.deploymentType if you want to reuse your Gen1 app tables
      c643a9b272.deploymentTypeName: 'main',
      modelNameToTableNameMapping: {
        Project: '8f96281b40.GetAtt6fe1426d26.GetAttProjectDataSourceNameName',
        Todo: 'ea7297173c.GetAttea7297173c.amplifyimportedresourcesgen2mainc643a9b272.deploymentType908544b6dddataamplifyDataTodoTodoDataSource108D508BNameName',
      },
    },
  ],
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: { expiresInDays: 7 },
  },
  schema,
});
