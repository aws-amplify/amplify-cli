import { defineData } from '@aws-amplify/backend';

const schema = `type QuoteResponse {
  message: String!
  quote: String!
  author: String!
  timestamp: String!
  totalQuotes: Int!
}

type Query {
  getRandomQuote: QuoteResponse
  getProject(id: ID!): Project @aws_api_key @aws_cognito_user_pools
  listProjects(filter: ModelProjectFilterInput, limit: Int, nextToken: String): ModelProjectConnection @aws_api_key @aws_cognito_user_pools
  getTodo(id: ID!): Todo @aws_api_key @aws_cognito_user_pools
  listTodos(filter: ModelTodoFilterInput, limit: Int, nextToken: String): ModelTodoConnection @aws_api_key @aws_cognito_user_pools
}

enum ProjectStatus {
  ACTIVE
  COMPLETED
  ON_HOLD
  ARCHIVED
}

type Project @aws_cognito_user_pools @aws_api_key {
  id: ID!
  title: String!
  description: String
  status: ProjectStatus!
  deadline: AWSDateTime
  color: String
  todos(filter: ModelTodoFilterInput, sortDirection: ModelSortDirection, limit: Int, nextToken: String): ModelTodoConnection
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
  owner: String
}

type Todo @aws_cognito_user_pools @aws_api_key {
  id: ID!
  name: String!
  description: String
  images: [String]
  projectID: ID
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
  projectTodosId: ID
  owner: String
}

input ModelStringInput {
  ne: String
  eq: String
  le: String
  lt: String
  ge: String
  gt: String
  contains: String
  notContains: String
  between: [String]
  beginsWith: String
  attributeExists: Boolean
  attributeType: ModelAttributeTypes
  size: ModelSizeInput
}

input ModelIntInput {
  ne: Int
  eq: Int
  le: Int
  lt: Int
  ge: Int
  gt: Int
  between: [Int]
  attributeExists: Boolean
  attributeType: ModelAttributeTypes
}

input ModelFloatInput {
  ne: Float
  eq: Float
  le: Float
  lt: Float
  ge: Float
  gt: Float
  between: [Float]
  attributeExists: Boolean
  attributeType: ModelAttributeTypes
}

input ModelBooleanInput {
  ne: Boolean
  eq: Boolean
  attributeExists: Boolean
  attributeType: ModelAttributeTypes
}

input ModelIDInput {
  ne: ID
  eq: ID
  le: ID
  lt: ID
  ge: ID
  gt: ID
  contains: ID
  notContains: ID
  between: [ID]
  beginsWith: ID
  attributeExists: Boolean
  attributeType: ModelAttributeTypes
  size: ModelSizeInput
}

input ModelSubscriptionStringInput {
  ne: String
  eq: String
  le: String
  lt: String
  ge: String
  gt: String
  contains: String
  notContains: String
  between: [String]
  beginsWith: String
  in: [String]
  notIn: [String]
}

input ModelSubscriptionIntInput {
  ne: Int
  eq: Int
  le: Int
  lt: Int
  ge: Int
  gt: Int
  between: [Int]
  in: [Int]
  notIn: [Int]
}

input ModelSubscriptionFloatInput {
  ne: Float
  eq: Float
  le: Float
  lt: Float
  ge: Float
  gt: Float
  between: [Float]
  in: [Float]
  notIn: [Float]
}

input ModelSubscriptionBooleanInput {
  ne: Boolean
  eq: Boolean
}

input ModelSubscriptionIDInput {
  ne: ID
  eq: ID
  le: ID
  lt: ID
  ge: ID
  gt: ID
  contains: ID
  notContains: ID
  between: [ID]
  beginsWith: ID
  in: [ID]
  notIn: [ID]
}

enum ModelAttributeTypes {
  binary
  binarySet
  bool
  list
  map
  number
  numberSet
  string
  stringSet
  _null
}

input ModelSizeInput {
  ne: Int
  eq: Int
  le: Int
  lt: Int
  ge: Int
  gt: Int
  between: [Int]
}

enum ModelSortDirection {
  ASC
  DESC
}

type ModelProjectConnection @aws_api_key @aws_cognito_user_pools {
  items: [Project]!
  nextToken: String
}

input ModelProjectStatusInput {
  eq: ProjectStatus
  ne: ProjectStatus
}

input ModelProjectFilterInput {
  id: ModelIDInput
  title: ModelStringInput
  description: ModelStringInput
  status: ModelProjectStatusInput
  deadline: ModelStringInput
  color: ModelStringInput
  createdAt: ModelStringInput
  updatedAt: ModelStringInput
  and: [ModelProjectFilterInput]
  or: [ModelProjectFilterInput]
  not: ModelProjectFilterInput
  owner: ModelStringInput
}

input ModelProjectConditionInput {
  title: ModelStringInput
  description: ModelStringInput
  status: ModelProjectStatusInput
  deadline: ModelStringInput
  color: ModelStringInput
  and: [ModelProjectConditionInput]
  or: [ModelProjectConditionInput]
  not: ModelProjectConditionInput
  createdAt: ModelStringInput
  updatedAt: ModelStringInput
  owner: ModelStringInput
}

input CreateProjectInput {
  id: ID
  title: String!
  description: String
  status: ProjectStatus!
  deadline: AWSDateTime
  color: String
}

input UpdateProjectInput {
  id: ID!
  title: String
  description: String
  status: ProjectStatus
  deadline: AWSDateTime
  color: String
}

input DeleteProjectInput {
  id: ID!
}

type Mutation {
  createProject(input: CreateProjectInput!, condition: ModelProjectConditionInput): Project @aws_cognito_user_pools
  updateProject(input: UpdateProjectInput!, condition: ModelProjectConditionInput): Project @aws_cognito_user_pools
  deleteProject(input: DeleteProjectInput!, condition: ModelProjectConditionInput): Project @aws_cognito_user_pools
  createTodo(input: CreateTodoInput!, condition: ModelTodoConditionInput): Todo @aws_cognito_user_pools
  updateTodo(input: UpdateTodoInput!, condition: ModelTodoConditionInput): Todo @aws_cognito_user_pools
  deleteTodo(input: DeleteTodoInput!, condition: ModelTodoConditionInput): Todo @aws_cognito_user_pools
}

input ModelSubscriptionProjectFilterInput {
  id: ModelSubscriptionIDInput
  title: ModelSubscriptionStringInput
  description: ModelSubscriptionStringInput
  status: ModelSubscriptionStringInput
  deadline: ModelSubscriptionStringInput
  color: ModelSubscriptionStringInput
  createdAt: ModelSubscriptionStringInput
  updatedAt: ModelSubscriptionStringInput
  and: [ModelSubscriptionProjectFilterInput]
  or: [ModelSubscriptionProjectFilterInput]
  projectTodosId: ModelSubscriptionIDInput
  owner: ModelStringInput
}

type Subscription {
  onCreateProject(filter: ModelSubscriptionProjectFilterInput, owner: String): Project @aws_subscribe(mutations: ["createProject"]) @aws_api_key @aws_cognito_user_pools
  onUpdateProject(filter: ModelSubscriptionProjectFilterInput, owner: String): Project @aws_subscribe(mutations: ["updateProject"]) @aws_api_key @aws_cognito_user_pools
  onDeleteProject(filter: ModelSubscriptionProjectFilterInput, owner: String): Project @aws_subscribe(mutations: ["deleteProject"]) @aws_api_key @aws_cognito_user_pools
  onCreateTodo(filter: ModelSubscriptionTodoFilterInput, owner: String): Todo @aws_subscribe(mutations: ["createTodo"]) @aws_api_key @aws_cognito_user_pools
  onUpdateTodo(filter: ModelSubscriptionTodoFilterInput, owner: String): Todo @aws_subscribe(mutations: ["updateTodo"]) @aws_api_key @aws_cognito_user_pools
  onDeleteTodo(filter: ModelSubscriptionTodoFilterInput, owner: String): Todo @aws_subscribe(mutations: ["deleteTodo"]) @aws_api_key @aws_cognito_user_pools
}

type ModelTodoConnection @aws_cognito_user_pools @aws_api_key {
  items: [Todo]!
  nextToken: String
}

input ModelTodoFilterInput {
  id: ModelIDInput
  name: ModelStringInput
  description: ModelStringInput
  images: ModelStringInput
  projectID: ModelIDInput
  createdAt: ModelStringInput
  updatedAt: ModelStringInput
  and: [ModelTodoFilterInput]
  or: [ModelTodoFilterInput]
  not: ModelTodoFilterInput
  projectTodosId: ModelIDInput
  owner: ModelStringInput
}

input ModelTodoConditionInput {
  name: ModelStringInput
  description: ModelStringInput
  images: ModelStringInput
  projectID: ModelIDInput
  and: [ModelTodoConditionInput]
  or: [ModelTodoConditionInput]
  not: ModelTodoConditionInput
  createdAt: ModelStringInput
  updatedAt: ModelStringInput
  projectTodosId: ModelIDInput
  owner: ModelStringInput
}

input CreateTodoInput {
  id: ID
  name: String!
  description: String
  images: [String]
  projectID: ID
  projectTodosId: ID
}

input UpdateTodoInput {
  id: ID!
  name: String
  description: String
  images: [String]
  projectID: ID
  projectTodosId: ID
}

input DeleteTodoInput {
  id: ID!
}

input ModelSubscriptionTodoFilterInput {
  id: ModelSubscriptionIDInput
  name: ModelSubscriptionStringInput
  description: ModelSubscriptionStringInput
  images: ModelSubscriptionStringInput
  projectID: ModelSubscriptionIDInput
  createdAt: ModelSubscriptionStringInput
  updatedAt: ModelSubscriptionStringInput
  and: [ModelSubscriptionTodoFilterInput]
  or: [ModelSubscriptionTodoFilterInput]
  owner: ModelStringInput
}
`;

export const data = defineData({
  migratedAmplifyGen1DynamoDbTableMappings: [
    {
      //The "branchname" variable needs to be the same as your deployment branch if you want to reuse your Gen1 app tables
      branchName: 'main',
      modelNameToTableNameMapping: {},
    },
  ],
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: { expiresInDays: 7 },
  },
  schema,
});
