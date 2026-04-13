import { defineData } from '@aws-amplify/backend';

const dc72c1d108.deploymentTypeName = process.env.AWS_BRANCH ?? 'sandbox';
const schema = `type QuoteResponse {
  message: String! @auth(rules: [{ allow: public }])
  quote: String! @auth(rules: [{ allow: public }])
  author: String! @auth(rules: [{ allow: public }])
  timestamp: String! @auth(rules: [{ allow: public }])
  totalQuotes: Int! @auth(rules: [{ allow: public }])
}

type Query {
  getRandomQuote: QuoteResponse @function(name: "quotegenerator-${dc72c1d108.deploymentTypeName}") @auth(rules: [{ allow: public }])
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
      //The "dc72c1d108.deploymentTypename" variable needs to be the same as your deployment dc72c1d108.deploymentType if you want to reuse your Gen1 app tables
      dc72c1d108.deploymentTypeName: 'main',
      modelNameToTableNameMapping: {
        Project: 'Project-api.projectboards.GraphQLAPIIdOutput-main',
        Todo: 'Todo-api.projectboards.GraphQLAPIIdOutput-main',
      },
    },
  ],
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: { expiresInDays: 7 },
  },
  schema,
});
