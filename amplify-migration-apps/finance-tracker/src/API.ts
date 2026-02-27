/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type NotificationResult = {
  __typename: 'NotificationResult';
  success: boolean;
  message: string;
};

export type CreateTransactionInput = {
  id?: string | null;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  receiptUrl?: string | null;
  owner?: string | null;
};

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export type ModelTransactionConditionInput = {
  description?: ModelStringInput | null;
  amount?: ModelFloatInput | null;
  type?: ModelTransactionTypeInput | null;
  category?: ModelStringInput | null;
  date?: ModelStringInput | null;
  receiptUrl?: ModelStringInput | null;
  owner?: ModelStringInput | null;
  and?: Array<ModelTransactionConditionInput | null> | null;
  or?: Array<ModelTransactionConditionInput | null> | null;
  not?: ModelTransactionConditionInput | null;
  createdAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
};

export type ModelStringInput = {
  ne?: string | null;
  eq?: string | null;
  le?: string | null;
  lt?: string | null;
  ge?: string | null;
  gt?: string | null;
  contains?: string | null;
  notContains?: string | null;
  between?: Array<string | null> | null;
  beginsWith?: string | null;
  attributeExists?: boolean | null;
  attributeType?: ModelAttributeTypes | null;
  size?: ModelSizeInput | null;
};

export enum ModelAttributeTypes {
  binary = 'binary',
  binarySet = 'binarySet',
  bool = 'bool',
  list = 'list',
  map = 'map',
  number = 'number',
  numberSet = 'numberSet',
  string = 'string',
  stringSet = 'stringSet',
  _null = '_null',
}

export type ModelSizeInput = {
  ne?: number | null;
  eq?: number | null;
  le?: number | null;
  lt?: number | null;
  ge?: number | null;
  gt?: number | null;
  between?: Array<number | null> | null;
};

export type ModelFloatInput = {
  ne?: number | null;
  eq?: number | null;
  le?: number | null;
  lt?: number | null;
  ge?: number | null;
  gt?: number | null;
  between?: Array<number | null> | null;
  attributeExists?: boolean | null;
  attributeType?: ModelAttributeTypes | null;
};

export type ModelTransactionTypeInput = {
  eq?: TransactionType | null;
  ne?: TransactionType | null;
};

export type Transaction = {
  __typename: 'Transaction';
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  receiptUrl?: string | null;
  owner?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpdateTransactionInput = {
  id: string;
  description?: string | null;
  amount?: number | null;
  type?: TransactionType | null;
  category?: string | null;
  date?: string | null;
  receiptUrl?: string | null;
  owner?: string | null;
};

export type DeleteTransactionInput = {
  id: string;
};

export type CreateBudgetInput = {
  id?: string | null;
  category: string;
  limit: number;
  month: string;
  owner?: string | null;
};

export type ModelBudgetConditionInput = {
  category?: ModelStringInput | null;
  limit?: ModelFloatInput | null;
  month?: ModelStringInput | null;
  owner?: ModelStringInput | null;
  and?: Array<ModelBudgetConditionInput | null> | null;
  or?: Array<ModelBudgetConditionInput | null> | null;
  not?: ModelBudgetConditionInput | null;
  createdAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
};

export type Budget = {
  __typename: 'Budget';
  id: string;
  category: string;
  limit: number;
  month: string;
  owner?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpdateBudgetInput = {
  id: string;
  category?: string | null;
  limit?: number | null;
  month?: string | null;
  owner?: string | null;
};

export type DeleteBudgetInput = {
  id: string;
};

export type CreateFinancialSummaryInput = {
  id?: string | null;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  month: string;
  owner?: string | null;
};

export type ModelFinancialSummaryConditionInput = {
  totalIncome?: ModelFloatInput | null;
  totalExpenses?: ModelFloatInput | null;
  balance?: ModelFloatInput | null;
  month?: ModelStringInput | null;
  owner?: ModelStringInput | null;
  and?: Array<ModelFinancialSummaryConditionInput | null> | null;
  or?: Array<ModelFinancialSummaryConditionInput | null> | null;
  not?: ModelFinancialSummaryConditionInput | null;
  createdAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
};

export type FinancialSummary = {
  __typename: 'FinancialSummary';
  id: string;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  month: string;
  owner?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpdateFinancialSummaryInput = {
  id: string;
  totalIncome?: number | null;
  totalExpenses?: number | null;
  balance?: number | null;
  month?: string | null;
  owner?: string | null;
};

export type DeleteFinancialSummaryInput = {
  id: string;
};

export type CalculatedSummary = {
  __typename: 'CalculatedSummary';
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  savingsRate: number;
};

export type ModelTransactionFilterInput = {
  id?: ModelIDInput | null;
  description?: ModelStringInput | null;
  amount?: ModelFloatInput | null;
  type?: ModelTransactionTypeInput | null;
  category?: ModelStringInput | null;
  date?: ModelStringInput | null;
  receiptUrl?: ModelStringInput | null;
  owner?: ModelStringInput | null;
  createdAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
  and?: Array<ModelTransactionFilterInput | null> | null;
  or?: Array<ModelTransactionFilterInput | null> | null;
  not?: ModelTransactionFilterInput | null;
};

export type ModelIDInput = {
  ne?: string | null;
  eq?: string | null;
  le?: string | null;
  lt?: string | null;
  ge?: string | null;
  gt?: string | null;
  contains?: string | null;
  notContains?: string | null;
  between?: Array<string | null> | null;
  beginsWith?: string | null;
  attributeExists?: boolean | null;
  attributeType?: ModelAttributeTypes | null;
  size?: ModelSizeInput | null;
};

export type ModelTransactionConnection = {
  __typename: 'ModelTransactionConnection';
  items: Array<Transaction | null>;
  nextToken?: string | null;
};

export type ModelBudgetFilterInput = {
  id?: ModelIDInput | null;
  category?: ModelStringInput | null;
  limit?: ModelFloatInput | null;
  month?: ModelStringInput | null;
  owner?: ModelStringInput | null;
  createdAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
  and?: Array<ModelBudgetFilterInput | null> | null;
  or?: Array<ModelBudgetFilterInput | null> | null;
  not?: ModelBudgetFilterInput | null;
};

export type ModelBudgetConnection = {
  __typename: 'ModelBudgetConnection';
  items: Array<Budget | null>;
  nextToken?: string | null;
};

export type ModelFinancialSummaryFilterInput = {
  id?: ModelIDInput | null;
  totalIncome?: ModelFloatInput | null;
  totalExpenses?: ModelFloatInput | null;
  balance?: ModelFloatInput | null;
  month?: ModelStringInput | null;
  owner?: ModelStringInput | null;
  createdAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
  and?: Array<ModelFinancialSummaryFilterInput | null> | null;
  or?: Array<ModelFinancialSummaryFilterInput | null> | null;
  not?: ModelFinancialSummaryFilterInput | null;
};

export type ModelFinancialSummaryConnection = {
  __typename: 'ModelFinancialSummaryConnection';
  items: Array<FinancialSummary | null>;
  nextToken?: string | null;
};

export type ModelSubscriptionTransactionFilterInput = {
  id?: ModelSubscriptionIDInput | null;
  description?: ModelSubscriptionStringInput | null;
  amount?: ModelSubscriptionFloatInput | null;
  type?: ModelSubscriptionStringInput | null;
  category?: ModelSubscriptionStringInput | null;
  date?: ModelSubscriptionStringInput | null;
  receiptUrl?: ModelSubscriptionStringInput | null;
  owner?: ModelSubscriptionStringInput | null;
  createdAt?: ModelSubscriptionStringInput | null;
  updatedAt?: ModelSubscriptionStringInput | null;
  and?: Array<ModelSubscriptionTransactionFilterInput | null> | null;
  or?: Array<ModelSubscriptionTransactionFilterInput | null> | null;
};

export type ModelSubscriptionIDInput = {
  ne?: string | null;
  eq?: string | null;
  le?: string | null;
  lt?: string | null;
  ge?: string | null;
  gt?: string | null;
  contains?: string | null;
  notContains?: string | null;
  between?: Array<string | null> | null;
  beginsWith?: string | null;
  in?: Array<string | null> | null;
  notIn?: Array<string | null> | null;
};

export type ModelSubscriptionStringInput = {
  ne?: string | null;
  eq?: string | null;
  le?: string | null;
  lt?: string | null;
  ge?: string | null;
  gt?: string | null;
  contains?: string | null;
  notContains?: string | null;
  between?: Array<string | null> | null;
  beginsWith?: string | null;
  in?: Array<string | null> | null;
  notIn?: Array<string | null> | null;
};

export type ModelSubscriptionFloatInput = {
  ne?: number | null;
  eq?: number | null;
  le?: number | null;
  lt?: number | null;
  ge?: number | null;
  gt?: number | null;
  between?: Array<number | null> | null;
  in?: Array<number | null> | null;
  notIn?: Array<number | null> | null;
};

export type ModelSubscriptionBudgetFilterInput = {
  id?: ModelSubscriptionIDInput | null;
  category?: ModelSubscriptionStringInput | null;
  limit?: ModelSubscriptionFloatInput | null;
  month?: ModelSubscriptionStringInput | null;
  owner?: ModelSubscriptionStringInput | null;
  createdAt?: ModelSubscriptionStringInput | null;
  updatedAt?: ModelSubscriptionStringInput | null;
  and?: Array<ModelSubscriptionBudgetFilterInput | null> | null;
  or?: Array<ModelSubscriptionBudgetFilterInput | null> | null;
};

export type ModelSubscriptionFinancialSummaryFilterInput = {
  id?: ModelSubscriptionIDInput | null;
  totalIncome?: ModelSubscriptionFloatInput | null;
  totalExpenses?: ModelSubscriptionFloatInput | null;
  balance?: ModelSubscriptionFloatInput | null;
  month?: ModelSubscriptionStringInput | null;
  owner?: ModelSubscriptionStringInput | null;
  createdAt?: ModelSubscriptionStringInput | null;
  updatedAt?: ModelSubscriptionStringInput | null;
  and?: Array<ModelSubscriptionFinancialSummaryFilterInput | null> | null;
  or?: Array<ModelSubscriptionFinancialSummaryFilterInput | null> | null;
};

export type SendMonthlyReportMutationVariables = {
  email: string;
};

export type SendMonthlyReportMutation = {
  sendMonthlyReport?: {
    __typename: 'NotificationResult';
    success: boolean;
    message: string;
  } | null;
};

export type SendBudgetAlertMutationVariables = {
  email: string;
  category: string;
  exceeded: number;
};

export type SendBudgetAlertMutation = {
  sendBudgetAlert?: {
    __typename: 'NotificationResult';
    success: boolean;
    message: string;
  } | null;
};

export type CreateTransactionMutationVariables = {
  input: CreateTransactionInput;
  condition?: ModelTransactionConditionInput | null;
};

export type CreateTransactionMutation = {
  createTransaction?: {
    __typename: 'Transaction';
    id: string;
    description: string;
    amount: number;
    type: TransactionType;
    category: string;
    date: string;
    receiptUrl?: string | null;
    owner?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type UpdateTransactionMutationVariables = {
  input: UpdateTransactionInput;
  condition?: ModelTransactionConditionInput | null;
};

export type UpdateTransactionMutation = {
  updateTransaction?: {
    __typename: 'Transaction';
    id: string;
    description: string;
    amount: number;
    type: TransactionType;
    category: string;
    date: string;
    receiptUrl?: string | null;
    owner?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type DeleteTransactionMutationVariables = {
  input: DeleteTransactionInput;
  condition?: ModelTransactionConditionInput | null;
};

export type DeleteTransactionMutation = {
  deleteTransaction?: {
    __typename: 'Transaction';
    id: string;
    description: string;
    amount: number;
    type: TransactionType;
    category: string;
    date: string;
    receiptUrl?: string | null;
    owner?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type CreateBudgetMutationVariables = {
  input: CreateBudgetInput;
  condition?: ModelBudgetConditionInput | null;
};

export type CreateBudgetMutation = {
  createBudget?: {
    __typename: 'Budget';
    id: string;
    category: string;
    limit: number;
    month: string;
    owner?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type UpdateBudgetMutationVariables = {
  input: UpdateBudgetInput;
  condition?: ModelBudgetConditionInput | null;
};

export type UpdateBudgetMutation = {
  updateBudget?: {
    __typename: 'Budget';
    id: string;
    category: string;
    limit: number;
    month: string;
    owner?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type DeleteBudgetMutationVariables = {
  input: DeleteBudgetInput;
  condition?: ModelBudgetConditionInput | null;
};

export type DeleteBudgetMutation = {
  deleteBudget?: {
    __typename: 'Budget';
    id: string;
    category: string;
    limit: number;
    month: string;
    owner?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type CreateFinancialSummaryMutationVariables = {
  input: CreateFinancialSummaryInput;
  condition?: ModelFinancialSummaryConditionInput | null;
};

export type CreateFinancialSummaryMutation = {
  createFinancialSummary?: {
    __typename: 'FinancialSummary';
    id: string;
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    month: string;
    owner?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type UpdateFinancialSummaryMutationVariables = {
  input: UpdateFinancialSummaryInput;
  condition?: ModelFinancialSummaryConditionInput | null;
};

export type UpdateFinancialSummaryMutation = {
  updateFinancialSummary?: {
    __typename: 'FinancialSummary';
    id: string;
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    month: string;
    owner?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type DeleteFinancialSummaryMutationVariables = {
  input: DeleteFinancialSummaryInput;
  condition?: ModelFinancialSummaryConditionInput | null;
};

export type DeleteFinancialSummaryMutation = {
  deleteFinancialSummary?: {
    __typename: 'FinancialSummary';
    id: string;
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    month: string;
    owner?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type CalculateFinancialSummaryQueryVariables = {};

export type CalculateFinancialSummaryQuery = {
  calculateFinancialSummary?: {
    __typename: 'CalculatedSummary';
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    savingsRate: number;
  } | null;
};

export type GetTransactionQueryVariables = {
  id: string;
};

export type GetTransactionQuery = {
  getTransaction?: {
    __typename: 'Transaction';
    id: string;
    description: string;
    amount: number;
    type: TransactionType;
    category: string;
    date: string;
    receiptUrl?: string | null;
    owner?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type ListTransactionsQueryVariables = {
  filter?: ModelTransactionFilterInput | null;
  limit?: number | null;
  nextToken?: string | null;
};

export type ListTransactionsQuery = {
  listTransactions?: {
    __typename: 'ModelTransactionConnection';
    items: Array<{
      __typename: 'Transaction';
      id: string;
      description: string;
      amount: number;
      type: TransactionType;
      category: string;
      date: string;
      receiptUrl?: string | null;
      owner?: string | null;
      createdAt: string;
      updatedAt: string;
    } | null>;
    nextToken?: string | null;
  } | null;
};

export type GetBudgetQueryVariables = {
  id: string;
};

export type GetBudgetQuery = {
  getBudget?: {
    __typename: 'Budget';
    id: string;
    category: string;
    limit: number;
    month: string;
    owner?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type ListBudgetsQueryVariables = {
  filter?: ModelBudgetFilterInput | null;
  limit?: number | null;
  nextToken?: string | null;
};

export type ListBudgetsQuery = {
  listBudgets?: {
    __typename: 'ModelBudgetConnection';
    items: Array<{
      __typename: 'Budget';
      id: string;
      category: string;
      limit: number;
      month: string;
      owner?: string | null;
      createdAt: string;
      updatedAt: string;
    } | null>;
    nextToken?: string | null;
  } | null;
};

export type GetFinancialSummaryQueryVariables = {
  id: string;
};

export type GetFinancialSummaryQuery = {
  getFinancialSummary?: {
    __typename: 'FinancialSummary';
    id: string;
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    month: string;
    owner?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type ListFinancialSummariesQueryVariables = {
  filter?: ModelFinancialSummaryFilterInput | null;
  limit?: number | null;
  nextToken?: string | null;
};

export type ListFinancialSummariesQuery = {
  listFinancialSummaries?: {
    __typename: 'ModelFinancialSummaryConnection';
    items: Array<{
      __typename: 'FinancialSummary';
      id: string;
      totalIncome: number;
      totalExpenses: number;
      balance: number;
      month: string;
      owner?: string | null;
      createdAt: string;
      updatedAt: string;
    } | null>;
    nextToken?: string | null;
  } | null;
};

export type OnCreateTransactionSubscriptionVariables = {
  filter?: ModelSubscriptionTransactionFilterInput | null;
};

export type OnCreateTransactionSubscription = {
  onCreateTransaction?: {
    __typename: 'Transaction';
    id: string;
    description: string;
    amount: number;
    type: TransactionType;
    category: string;
    date: string;
    receiptUrl?: string | null;
    owner?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnUpdateTransactionSubscriptionVariables = {
  filter?: ModelSubscriptionTransactionFilterInput | null;
};

export type OnUpdateTransactionSubscription = {
  onUpdateTransaction?: {
    __typename: 'Transaction';
    id: string;
    description: string;
    amount: number;
    type: TransactionType;
    category: string;
    date: string;
    receiptUrl?: string | null;
    owner?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnDeleteTransactionSubscriptionVariables = {
  filter?: ModelSubscriptionTransactionFilterInput | null;
};

export type OnDeleteTransactionSubscription = {
  onDeleteTransaction?: {
    __typename: 'Transaction';
    id: string;
    description: string;
    amount: number;
    type: TransactionType;
    category: string;
    date: string;
    receiptUrl?: string | null;
    owner?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnCreateBudgetSubscriptionVariables = {
  filter?: ModelSubscriptionBudgetFilterInput | null;
};

export type OnCreateBudgetSubscription = {
  onCreateBudget?: {
    __typename: 'Budget';
    id: string;
    category: string;
    limit: number;
    month: string;
    owner?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnUpdateBudgetSubscriptionVariables = {
  filter?: ModelSubscriptionBudgetFilterInput | null;
};

export type OnUpdateBudgetSubscription = {
  onUpdateBudget?: {
    __typename: 'Budget';
    id: string;
    category: string;
    limit: number;
    month: string;
    owner?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnDeleteBudgetSubscriptionVariables = {
  filter?: ModelSubscriptionBudgetFilterInput | null;
};

export type OnDeleteBudgetSubscription = {
  onDeleteBudget?: {
    __typename: 'Budget';
    id: string;
    category: string;
    limit: number;
    month: string;
    owner?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnCreateFinancialSummarySubscriptionVariables = {
  filter?: ModelSubscriptionFinancialSummaryFilterInput | null;
};

export type OnCreateFinancialSummarySubscription = {
  onCreateFinancialSummary?: {
    __typename: 'FinancialSummary';
    id: string;
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    month: string;
    owner?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnUpdateFinancialSummarySubscriptionVariables = {
  filter?: ModelSubscriptionFinancialSummaryFilterInput | null;
};

export type OnUpdateFinancialSummarySubscription = {
  onUpdateFinancialSummary?: {
    __typename: 'FinancialSummary';
    id: string;
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    month: string;
    owner?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnDeleteFinancialSummarySubscriptionVariables = {
  filter?: ModelSubscriptionFinancialSummaryFilterInput | null;
};

export type OnDeleteFinancialSummarySubscription = {
  onDeleteFinancialSummary?: {
    __typename: 'FinancialSummary';
    id: string;
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    month: string;
    owner?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};
