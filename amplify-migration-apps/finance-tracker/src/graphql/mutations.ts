/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from '../API';
type GeneratedMutation<InputType, OutputType> = string & {
  __generatedMutationInput: InputType;
  __generatedMutationOutput: OutputType;
};

export const sendMonthlyReport = /* GraphQL */ `mutation SendMonthlyReport($email: String!) {
  sendMonthlyReport(email: $email) {
    success
    message
    __typename
  }
}
` as GeneratedMutation<APITypes.SendMonthlyReportMutationVariables, APITypes.SendMonthlyReportMutation>;
export const sendBudgetAlert = /* GraphQL */ `mutation SendBudgetAlert(
  $email: String!
  $category: String!
  $exceeded: Float!
) {
  sendBudgetAlert(email: $email, category: $category, exceeded: $exceeded) {
    success
    message
    __typename
  }
}
` as GeneratedMutation<APITypes.SendBudgetAlertMutationVariables, APITypes.SendBudgetAlertMutation>;
export const createTransaction = /* GraphQL */ `mutation CreateTransaction(
  $input: CreateTransactionInput!
  $condition: ModelTransactionConditionInput
) {
  createTransaction(input: $input, condition: $condition) {
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
` as GeneratedMutation<APITypes.CreateTransactionMutationVariables, APITypes.CreateTransactionMutation>;
export const updateTransaction = /* GraphQL */ `mutation UpdateTransaction(
  $input: UpdateTransactionInput!
  $condition: ModelTransactionConditionInput
) {
  updateTransaction(input: $input, condition: $condition) {
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
` as GeneratedMutation<APITypes.UpdateTransactionMutationVariables, APITypes.UpdateTransactionMutation>;
export const deleteTransaction = /* GraphQL */ `mutation DeleteTransaction(
  $input: DeleteTransactionInput!
  $condition: ModelTransactionConditionInput
) {
  deleteTransaction(input: $input, condition: $condition) {
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
` as GeneratedMutation<APITypes.DeleteTransactionMutationVariables, APITypes.DeleteTransactionMutation>;
export const createBudget = /* GraphQL */ `mutation CreateBudget(
  $input: CreateBudgetInput!
  $condition: ModelBudgetConditionInput
) {
  createBudget(input: $input, condition: $condition) {
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
` as GeneratedMutation<APITypes.CreateBudgetMutationVariables, APITypes.CreateBudgetMutation>;
export const updateBudget = /* GraphQL */ `mutation UpdateBudget(
  $input: UpdateBudgetInput!
  $condition: ModelBudgetConditionInput
) {
  updateBudget(input: $input, condition: $condition) {
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
` as GeneratedMutation<APITypes.UpdateBudgetMutationVariables, APITypes.UpdateBudgetMutation>;
export const deleteBudget = /* GraphQL */ `mutation DeleteBudget(
  $input: DeleteBudgetInput!
  $condition: ModelBudgetConditionInput
) {
  deleteBudget(input: $input, condition: $condition) {
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
` as GeneratedMutation<APITypes.DeleteBudgetMutationVariables, APITypes.DeleteBudgetMutation>;
export const createFinancialSummary = /* GraphQL */ `mutation CreateFinancialSummary(
  $input: CreateFinancialSummaryInput!
  $condition: ModelFinancialSummaryConditionInput
) {
  createFinancialSummary(input: $input, condition: $condition) {
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
` as GeneratedMutation<APITypes.CreateFinancialSummaryMutationVariables, APITypes.CreateFinancialSummaryMutation>;
export const updateFinancialSummary = /* GraphQL */ `mutation UpdateFinancialSummary(
  $input: UpdateFinancialSummaryInput!
  $condition: ModelFinancialSummaryConditionInput
) {
  updateFinancialSummary(input: $input, condition: $condition) {
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
` as GeneratedMutation<APITypes.UpdateFinancialSummaryMutationVariables, APITypes.UpdateFinancialSummaryMutation>;
export const deleteFinancialSummary = /* GraphQL */ `mutation DeleteFinancialSummary(
  $input: DeleteFinancialSummaryInput!
  $condition: ModelFinancialSummaryConditionInput
) {
  deleteFinancialSummary(input: $input, condition: $condition) {
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
` as GeneratedMutation<APITypes.DeleteFinancialSummaryMutationVariables, APITypes.DeleteFinancialSummaryMutation>;
