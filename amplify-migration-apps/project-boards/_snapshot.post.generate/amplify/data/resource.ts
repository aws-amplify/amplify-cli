import { defineData } from '@aws-amplify/backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';
const schema = `type QuoteResponse {
  message: String! @auth(rules: [{ allow: public }])
  quote: String! @auth(rules: [{ allow: public }])
  author: String! @auth(rules: [{ allow: public }])
  timestamp: String! @auth(rules: [{ allow: public }])
  totalQuotes: Int! @auth(rules: [{ allow: public }])
}

type Query {
  getRandomQuote: QuoteResponse @function(name: "quotegenerator-${branchName}") @auth(rules: [{ allow: public }])
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
      //The "branchname" variable needs to be the same as your deployment branch if you want to reuse your Gen1 app tables
      branchName: 'x',
      modelNameToTableNameMapping: {
        Project: 'e36cd6b3cb.GetAtta7e707e99e.GetAttProjectDataSourceNameName',
        Todo: '5c1e28b4a7.GetAtt5c1e28b4a7.amplifyprojectboardse2esandbox0404234937dataamplifyDataTodoTodoDataSourceE4A2C3DANameName',
      },
    },
  ],
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: { expiresInDays: 7 },
  },
  schema,
});
