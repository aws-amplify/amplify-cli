import { defineData } from '@aws-amplify/backend';
import type { Backend } from '../backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';
const schema = `type Transaction @model @auth(rules: [{ allow: public, operations: [read] }, { allow: owner, operations: [create, read, update, delete] }]) {
  id: ID!
  description: String!
  amount: Float!
  type: TransactionType!
  category: String!
  date: AWSDateTime!
  receiptUrl: String
  owner: String
}

enum TransactionType {
  INCOME
  EXPENSE
}

type Budget @model @auth(rules: [{ allow: public, operations: [read] }, { allow: owner, operations: [create, read, update, delete] }]) {
  id: ID!
  category: String!
  limit: Float!
  month: String!
  owner: String
}

type FinancialSummary @model @auth(rules: [{ allow: public, operations: [read] }, { allow: owner, operations: [create, read, update, delete] }]) {
  id: ID!
  totalIncome: Float!
  totalExpenses: Float!
  balance: Float!
  month: String!
  owner: String
}

type CalculatedSummary {
  totalIncome: Float! @auth(rules: [{ allow: public }])
  totalExpenses: Float! @auth(rules: [{ allow: public }])
  balance: Float! @auth(rules: [{ allow: public }])
  savingsRate: Float! @auth(rules: [{ allow: public }])
}

type NotificationResult {
  success: Boolean! @auth(rules: [{ allow: public }])
  message: String! @auth(rules: [{ allow: public }])
}


type TransactionConnection {
  items: [Transaction]
  nextToken: String
}

type Query {
  calculateFinancialSummary: CalculatedSummary @function(name: "financetracker-${branchName}") @auth(rules: [{ allow: public }])
  getTransactionsByCategory(category: String!, limit: Int): TransactionConnection
}

type Mutation {
  sendMonthlyReport(email: String!): NotificationResult @function(name: "financetracker-${branchName}") @auth(rules: [{ allow: public }])
  sendBudgetAlert(email: String!, category: String!, exceeded: Float!): NotificationResult @function(name: "financetracker-${branchName}") @auth(rules: [{ allow: public }])
}
`;

export const data = defineData({
  migratedAmplifyGen1DynamoDbTableMappings: [
    {
      //The "branchName" variable needs to be the same as your deployment branch if you want to reuse your Gen1 app tables
      branchName: 'x',
      modelNameToTableNameMapping: {
        Transaction: 'Transaction-advknbihlbchtlonmy35v53toa-x',
        Budget: 'Budget-advknbihlbchtlonmy35v53toa-x',
        FinancialSummary: 'FinancialSummary-advknbihlbchtlonmy35v53toa-x',
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
