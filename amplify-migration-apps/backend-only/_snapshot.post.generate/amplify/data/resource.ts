import { defineData } from '@aws-amplify/backend';
import type { Backend } from '../backend';

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

enum Priority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum Category {
  GENERAL
  TECHNICAL
  BUSINESS
  SUPPORT
  MARKETING
}

type Address {
  street: String
  city: String
  state: String
  zip: String
  country: String
}

type Metadata {
  key: String
  value: String
  timestamp: AWSDateTime
}

type Coordinates {
  latitude: Float
  longitude: Float
  altitude: Float
}

# Mega model with 30 fields (scalar + custom types), 10 relations, and 5 indexes with sort keys
type MegaModel @model @auth(rules: [
  { allow: public, operations: [read] },
  { allow: owner, operations: [create, read, update, delete] }
]) {
  id: ID!
  # Scalar fields
  title: String!
  description: String
  status: ProjectStatus! @index(name: "byStatusAndCreatedAt", sortKeyFields: ["createdAt", "priority"])
  priority: Priority! @index(name: "byPriorityAndDeadline", sortKeyFields: ["deadline", "status"])
  category: Category! @index(name: "byCategoryAndTitle", sortKeyFields: ["title", "score"])
  score: Int
  rating: Float
  isActive: Boolean
  deadline: AWSDateTime
  createdAt: AWSDateTime
  updatedAt: AWSDateTime
  startDate: AWSDate
  endDate: AWSDate
  duration: Int
  ownerEmail: AWSEmail @index(name: "byOwnerAndScore", sortKeyFields: ["score", "createdAt"])
  websiteUrl: AWSURL
  phoneNumber: AWSPhone
  region: String @index(name: "byRegionAndUpdatedAt", sortKeyFields: ["updatedAt", "category"])
  tags: [String]
  version: Int
  weight: Float
  # Custom type fields
  address: Address
  metadata: Metadata
  coordinates: Coordinates
  notes: [String]
  config: AWSJSON
  ipAddress: AWSIPAddress
  timestamp: AWSTimestamp
  # Relations (5 hasMany + 5 hasOne)
  megaChildAItems: [MegaChildA] @hasMany(indexName: "byMegaModel", fields: ["id"])
  megaChildBItems: [MegaChildB] @hasMany(indexName: "byMegaModel", fields: ["id"])
  megaChildCItems: [MegaChildC] @hasMany(indexName: "byMegaModel", fields: ["id"])
  megaChildDItems: [MegaChildD] @hasMany(indexName: "byMegaModel", fields: ["id"])
  megaChildEItems: [MegaChildE] @hasMany(indexName: "byMegaModel", fields: ["id"])
  relatedF: MegaRelatedF @hasOne
  relatedG: MegaRelatedG @hasOne
  relatedH: MegaRelatedH @hasOne
  relatedI: MegaRelatedI @hasOne
  relatedJ: MegaRelatedJ @hasOne
}

# hasMany child models
type MegaChildA @model @auth(rules: [{ allow: public, operations: [read] }, { allow: owner }]) {
  id: ID!
  title: String!
  megaModelID: ID! @index(name: "byMegaModel")
}

type MegaChildB @model @auth(rules: [{ allow: public, operations: [read] }, { allow: owner }]) {
  id: ID!
  title: String!
  megaModelID: ID! @index(name: "byMegaModel")
}

type MegaChildC @model @auth(rules: [{ allow: public, operations: [read] }, { allow: owner }]) {
  id: ID!
  title: String!
  megaModelID: ID! @index(name: "byMegaModel")
}

type MegaChildD @model @auth(rules: [{ allow: public, operations: [read] }, { allow: owner }]) {
  id: ID!
  title: String!
  megaModelID: ID! @index(name: "byMegaModel")
}

type MegaChildE @model @auth(rules: [{ allow: public, operations: [read] }, { allow: owner }]) {
  id: ID!
  title: String!
  megaModelID: ID! @index(name: "byMegaModel")
}

# hasOne related models
type MegaRelatedF @model @auth(rules: [{ allow: public, operations: [read] }, { allow: owner }]) {
  id: ID!
  title: String!
  description: String
}

type MegaRelatedG @model @auth(rules: [{ allow: public, operations: [read] }, { allow: owner }]) {
  id: ID!
  title: String!
  description: String
}

type MegaRelatedH @model @auth(rules: [{ allow: public, operations: [read] }, { allow: owner }]) {
  id: ID!
  title: String!
  description: String
}

type MegaRelatedI @model @auth(rules: [{ allow: public, operations: [read] }, { allow: owner }]) {
  id: ID!
  title: String!
  description: String
}

type MegaRelatedJ @model @auth(rules: [{ allow: public, operations: [read] }, { allow: owner }]) {
  id: ID!
  title: String!
  description: String
}
`;

export const data = defineData({
  migratedAmplifyGen1DynamoDbTableMappings: [
    {
      //The "branchName" variable needs to be the same as your deployment branch if you want to reuse your Gen1 app tables
      branchName: 'x',
      modelNameToTableNameMapping: {
        Project: 'Project-swnmmzmw75hwtclcpxwndu4aia-x',
        Todo: 'Todo-swnmmzmw75hwtclcpxwndu4aia-x',
        MegaModel: 'MegaModel-swnmmzmw75hwtclcpxwndu4aia-x',
        MegaChildA: 'MegaChildA-swnmmzmw75hwtclcpxwndu4aia-x',
        MegaChildB: 'MegaChildB-swnmmzmw75hwtclcpxwndu4aia-x',
        MegaChildC: 'MegaChildC-swnmmzmw75hwtclcpxwndu4aia-x',
        MegaChildD: 'MegaChildD-swnmmzmw75hwtclcpxwndu4aia-x',
        MegaChildE: 'MegaChildE-swnmmzmw75hwtclcpxwndu4aia-x',
        MegaRelatedF: 'MegaRelatedF-swnmmzmw75hwtclcpxwndu4aia-x',
        MegaRelatedG: 'MegaRelatedG-swnmmzmw75hwtclcpxwndu4aia-x',
        MegaRelatedH: 'MegaRelatedH-swnmmzmw75hwtclcpxwndu4aia-x',
        MegaRelatedI: 'MegaRelatedI-swnmmzmw75hwtclcpxwndu4aia-x',
        MegaRelatedJ: 'MegaRelatedJ-swnmmzmw75hwtclcpxwndu4aia-x',
      },
    },
  ],
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: { expiresInDays: 7 },
  },
  schema,
});

export function applyEscapeHatches(backend: Backend) {
  const cfnGraphqlApi = backend.data.resources.cfnResources.cfnGraphqlApi;
  cfnGraphqlApi.additionalAuthenticationProviders = [
    {
      authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      userPoolConfig: {
        userPoolId: backend.auth.resources.userPool.userPoolId,
        awsRegion: backend.auth.stack.region,
      },
    },
  ];
}
