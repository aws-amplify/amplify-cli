import { defineData } from '@aws-amplify/backend';
import type { Backend } from '../backend';
import { aws_iam } from 'aws-cdk-lib';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';
const schema = `enum UserRole {
  ADMIN
  MANAGER
  VIEWER
}

type User @model @auth(rules: [
  { allow: private, provider: iam },
  { allow: owner, ownerField: "id" }
]) {
  id: ID!
  email: String!
  name: String!
  role: UserRole!
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}

type Product @model @auth(rules: [{ allow: private, provider: iam }]) {
  id: ID!
  serialno: Int!
  engword: String!
  price: Float
  category: String
  description: String
  stock: Int
  brand: String
  imageKey: String
  imageUploadedAt: String
  images: [String]
  createdBy: String
  updatedBy: String
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
  comments: [Comment] @hasMany(indexName: "byProduct", fields: ["id"])
}

type Comment @model @auth(rules: [
  { allow: private, provider: iam },
  { allow: owner, ownerField: "authorId" }
]) {
  id: ID!
  productId: ID! @index(name: "byProduct")
  authorId: String!
  authorName: String!
  content: String!
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}

type LowStockProduct {
  name: String!
  stock: Int!
}

type LowStockResponse {
  message: String!
  lowStockProducts: [LowStockProduct!]!
}

type Query {
  checkLowStock: LowStockResponse @function(name: "lowstockproducts-${branchName}") @auth(rules: [
    { allow: private, provider: iam },
    { allow: public, provider: apiKey }
  ])
}
`;

export const data = defineData({
  migratedAmplifyGen1DynamoDbTableMappings: [
    {
      //The "branchName" variable needs to be the same as your deployment branch if you want to reuse your Gen1 app tables
      branchName: 'x',
      modelNameToTableNameMapping: {
        User: 'User-ygivvj3x3fgkjcyo2xd4oyyhuu-x',
        Product: 'Product-ygivvj3x3fgkjcyo2xd4oyyhuu-x',
        Comment: 'Comment-ygivvj3x3fgkjcyo2xd4oyyhuu-x',
      },
    },
  ],
  authorizationModes: {
    defaultAuthorizationMode: 'iam',
    apiKeyAuthorizationMode: { expiresInDays: 7, description: 'graphqlapi' },
  },
  schema,
});

export function applyEscapeHatches(backend: Backend) {
  const cfnGraphqlApi = backend.data.resources.cfnResources.cfnGraphqlApi;
  cfnGraphqlApi.additionalAuthenticationProviders = [
    {
      authenticationType: 'API_KEY',
    },
    {
      authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      userPoolConfig: {
        userPoolId: backend.auth.resources.userPool.userPoolId,
        awsRegion: backend.auth.stack.region,
      },
    },
  ];
  backend.auth.resources.authenticatedUserIamRole.addToPrincipalPolicy(
    new aws_iam.PolicyStatement({
      effect: aws_iam.Effect.ALLOW,
      actions: ['appsync:GraphQL'],
      resources: [
        `arn:aws:appsync:${backend.data.stack.region}:${backend.data.stack.account}:apis/ygivvj3x3fgkjcyo2xd4oyyhuu/*`,
      ],
    })
  );
}
