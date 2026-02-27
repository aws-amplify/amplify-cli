/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from '../API';
type GeneratedQuery<InputType, OutputType> = string & {
  __generatedQueryInput: InputType;
  __generatedQueryOutput: OutputType;
};

export const calculateFinancialSummary = /* GraphQL */ `query CalculateFinancialSummary {
  calculateFinancialSummary {
    totalIncome
    totalExpenses
    balance
    savingsRate
    __typename
  }
}
` as GeneratedQuery<APITypes.CalculateFinancialSummaryQueryVariables, APITypes.CalculateFinancialSummaryQuery>;
export const getTransaction = /* GraphQL */ `query GetTransaction($id: ID!) {
  getTransaction(id: $id) {
    id
    description
    amount
    type
    category
    date
    receiptUrl
    owner
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedQuery<APITypes.GetTransactionQueryVariables, APITypes.GetTransactionQuery>;
export const listTransactions = /* GraphQL */ `query ListTransactions(
  $filter: ModelTransactionFilterInput
  $limit: Int
  $nextToken: String
) {
  listTransactions(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      description
      amount
      type
      category
      date
      receiptUrl
      owner
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<APITypes.ListTransactionsQueryVariables, APITypes.ListTransactionsQuery>;
export const getBudget = /* GraphQL */ `query GetBudget($id: ID!) {
  getBudget(id: $id) {
    id
    category
    limit
    month
    owner
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedQuery<APITypes.GetBudgetQueryVariables, APITypes.GetBudgetQuery>;
export const listBudgets = /* GraphQL */ `query ListBudgets(
  $filter: ModelBudgetFilterInput
  $limit: Int
  $nextToken: String
) {
  listBudgets(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      category
      limit
      month
      owner
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<APITypes.ListBudgetsQueryVariables, APITypes.ListBudgetsQuery>;
export const getFinancialSummary = /* GraphQL */ `query GetFinancialSummary($id: ID!) {
  getFinancialSummary(id: $id) {
    id
    totalIncome
    totalExpenses
    balance
    month
    owner
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedQuery<APITypes.GetFinancialSummaryQueryVariables, APITypes.GetFinancialSummaryQuery>;
export const listFinancialSummaries = /* GraphQL */ `query ListFinancialSummaries(
  $filter: ModelFinancialSummaryFilterInput
  $limit: Int
  $nextToken: String
) {
  listFinancialSummaries(
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      totalIncome
      totalExpenses
      balance
      month
      owner
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<APITypes.ListFinancialSummariesQueryVariables, APITypes.ListFinancialSummariesQuery>;
