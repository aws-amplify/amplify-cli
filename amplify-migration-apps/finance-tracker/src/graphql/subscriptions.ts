/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from '../API';
type GeneratedSubscription<InputType, OutputType> = string & {
  __generatedSubscriptionInput: InputType;
  __generatedSubscriptionOutput: OutputType;
};

export const onCreateTransaction = /* GraphQL */ `subscription OnCreateTransaction(
  $filter: ModelSubscriptionTransactionFilterInput
) {
  onCreateTransaction(filter: $filter) {
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
` as GeneratedSubscription<APITypes.OnCreateTransactionSubscriptionVariables, APITypes.OnCreateTransactionSubscription>;
export const onUpdateTransaction = /* GraphQL */ `subscription OnUpdateTransaction(
  $filter: ModelSubscriptionTransactionFilterInput
) {
  onUpdateTransaction(filter: $filter) {
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
` as GeneratedSubscription<APITypes.OnUpdateTransactionSubscriptionVariables, APITypes.OnUpdateTransactionSubscription>;
export const onDeleteTransaction = /* GraphQL */ `subscription OnDeleteTransaction(
  $filter: ModelSubscriptionTransactionFilterInput
) {
  onDeleteTransaction(filter: $filter) {
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
` as GeneratedSubscription<APITypes.OnDeleteTransactionSubscriptionVariables, APITypes.OnDeleteTransactionSubscription>;
export const onCreateBudget = /* GraphQL */ `subscription OnCreateBudget($filter: ModelSubscriptionBudgetFilterInput) {
  onCreateBudget(filter: $filter) {
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
` as GeneratedSubscription<APITypes.OnCreateBudgetSubscriptionVariables, APITypes.OnCreateBudgetSubscription>;
export const onUpdateBudget = /* GraphQL */ `subscription OnUpdateBudget($filter: ModelSubscriptionBudgetFilterInput) {
  onUpdateBudget(filter: $filter) {
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
` as GeneratedSubscription<APITypes.OnUpdateBudgetSubscriptionVariables, APITypes.OnUpdateBudgetSubscription>;
export const onDeleteBudget = /* GraphQL */ `subscription OnDeleteBudget($filter: ModelSubscriptionBudgetFilterInput) {
  onDeleteBudget(filter: $filter) {
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
` as GeneratedSubscription<APITypes.OnDeleteBudgetSubscriptionVariables, APITypes.OnDeleteBudgetSubscription>;
export const onCreateFinancialSummary = /* GraphQL */ `subscription OnCreateFinancialSummary(
  $filter: ModelSubscriptionFinancialSummaryFilterInput
) {
  onCreateFinancialSummary(filter: $filter) {
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
` as GeneratedSubscription<APITypes.OnCreateFinancialSummarySubscriptionVariables, APITypes.OnCreateFinancialSummarySubscription>;
export const onUpdateFinancialSummary = /* GraphQL */ `subscription OnUpdateFinancialSummary(
  $filter: ModelSubscriptionFinancialSummaryFilterInput
) {
  onUpdateFinancialSummary(filter: $filter) {
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
` as GeneratedSubscription<APITypes.OnUpdateFinancialSummarySubscriptionVariables, APITypes.OnUpdateFinancialSummarySubscription>;
export const onDeleteFinancialSummary = /* GraphQL */ `subscription OnDeleteFinancialSummary(
  $filter: ModelSubscriptionFinancialSummaryFilterInput
) {
  onDeleteFinancialSummary(filter: $filter) {
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
` as GeneratedSubscription<APITypes.OnDeleteFinancialSummarySubscriptionVariables, APITypes.OnDeleteFinancialSummarySubscription>;
