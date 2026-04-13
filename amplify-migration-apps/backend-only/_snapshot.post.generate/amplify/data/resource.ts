import { defineData } from '@aws-amplify/backend';

const c0d444ea7b.deploymentTypeName = process.env.AWS_BRANCH ?? 'sandbox';
const schema = `type QuoteResponse {
  message: String! @auth(rules: [{ allow: public }])
  quote: String! @auth(rules: [{ allow: public }])
  author: String! @auth(rules: [{ allow: public }])
  timestamp: String! @auth(rules: [{ allow: public }])
  totalQuotes: Int! @auth(rules: [{ allow: public }])
}

type Query {
  getRandomQuote: QuoteResponse @function(name: "quotegenerator-${c0d444ea7b.deploymentTypeName}") @auth(rules: [{ allow: public }])
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
      //The "c0d444ea7b.deploymentTypename" variable needs to be the same as your deployment c0d444ea7b.deploymentType if you want to reuse your Gen1 app tables
      c0d444ea7b.deploymentTypeName: 'main',
      modelNameToTableNameMapping: {
        Project: '286a0ee155.GetAtt7a51ff3517.GetAttProjectDataSourceNameName',
        Todo: '052354d56a.GetAtt052354d56a.amplifybackendonlygen2mainc0d444ea7b.deploymentType8e0f260810dataamplifyDataTodoTodoDataSourceB3ECF35ANameName',
      },
    },
  ],
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: { expiresInDays: 7 },
  },
  schema,
});
