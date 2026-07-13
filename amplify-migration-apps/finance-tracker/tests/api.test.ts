/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateClient } from 'aws-amplify/api';
import { signIn, signOut } from 'aws-amplify/auth';
import { signUp, config } from './signup';
import {
  getTransaction, listTransactions,
  calculateFinancialSummary,
  getFinancialSummary, listFinancialSummaries,
  getTransactionsByCategory,
} from '../src/graphql/queries';
import {
  createTransaction, updateTransaction, deleteTransaction,
  createFinancialSummary, deleteFinancialSummary,
  sendMonthlyReport, sendBudgetAlert,
} from '../src/graphql/mutations';
import { TransactionType } from '../src/API';

// Mutations require owner auth; reads work with API key
const authClient = () => generateClient({ authMode: 'userPool' });
const publicClient = () => generateClient({ authMode: 'apiKey' });

beforeAll(async () => {
  const creds = await signUp(config);
  await signIn({ username: creds.username, password: creds.password });
}, 60_000);

afterAll(async () => {
  await signOut();
});

async function createTestTransaction(overrides: Record<string, any> = {}) {
  const input = {
    description: `Test transaction - ${Date.now()}`,
    amount: 85.50,
    type: TransactionType.EXPENSE,
    category: 'Food',
    date: new Date().toISOString(),
    ...overrides,
  };
  const result = await authClient().graphql({ query: createTransaction, variables: { input } });
  return (result as any).data.createTransaction;
}

async function createTestSummary(overrides: Record<string, any> = {}) {
  const input = {
    totalIncome: 5000.00,
    totalExpenses: 3200.00,
    balance: 1800.00,
    month: '2026-04',
    ...overrides,
  };
  const result = await authClient().graphql({ query: createFinancialSummary, variables: { input } });
  return (result as any).data.createFinancialSummary;
}

describe('Transaction', () => {
  it('creates a transaction with correct fields', async () => {
    const txn = await createTestTransaction({ description: `Grocery shopping - ${Date.now()}` });

    expect(typeof txn.id).toBe('string');
    expect(txn.id.length).toBeGreaterThan(0);
    expect(txn.amount).toBe(85.50);
    expect(txn.type).toBe(TransactionType.EXPENSE);
    expect(txn.category).toBe('Food');
    expect(txn.createdAt).toBeDefined();
    expect(txn.updatedAt).toBeDefined();
  });

  it('reads a transaction by id', async () => {
    const txn = await createTestTransaction();

    const result = await publicClient().graphql({ query: getTransaction, variables: { id: txn.id } });
    const fetched = (result as any).data.getTransaction;

    expect(fetched).not.toBeNull();
    expect(fetched.id).toBe(txn.id);
    expect(fetched.category).toBe('Food');
  });

  it('updates a transaction and persists changes', async () => {
    const txn = await createTestTransaction();
    const updatedDesc = `Updated grocery - ${Date.now()}`;

    await authClient().graphql({
      query: updateTransaction,
      variables: { input: { id: txn.id, description: updatedDesc, amount: 92.00 } },
    });

    const result = await publicClient().graphql({ query: getTransaction, variables: { id: txn.id } });
    const fetched = (result as any).data.getTransaction;

    expect(fetched.description).toBe(updatedDesc);
    expect(fetched.amount).toBe(92.00);
  });

  it('lists transactions', async () => {
    await createTestTransaction();

    const result = await publicClient().graphql({ query: listTransactions });
    const items = (result as any).data.listTransactions.items;

    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);
  });

  it('deletes a transaction', async () => {
    const txn = await createTestTransaction();

    await authClient().graphql({ query: deleteTransaction, variables: { input: { id: txn.id } } });

    const result = await publicClient().graphql({ query: getTransaction, variables: { id: txn.id } });
    expect((result as any).data.getTransaction).toBeNull();
  });
});

describe('FinancialSummary', () => {
  it('creates a financial summary', async () => {
    const summary = await createTestSummary();

    expect(typeof summary.id).toBe('string');
    expect(summary.totalIncome).toBe(5000.00);
    expect(summary.totalExpenses).toBe(3200.00);
    expect(summary.balance).toBe(1800.00);
    expect(summary.month).toBe('2026-04');
    expect(summary.createdAt).toBeDefined();
  });

  it('reads a financial summary by id', async () => {
    const summary = await createTestSummary();

    const result = await publicClient().graphql({ query: getFinancialSummary, variables: { id: summary.id } });
    const fetched = (result as any).data.getFinancialSummary;

    expect(fetched).not.toBeNull();
    expect(fetched.id).toBe(summary.id);
    expect(fetched.month).toBe('2026-04');
  });

  it('lists financial summaries', async () => {
    await createTestSummary();

    const result = await publicClient().graphql({ query: listFinancialSummaries });
    const items = (result as any).data.listFinancialSummaries.items;

    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);
  });

  it('deletes a financial summary', async () => {
    const summary = await createTestSummary();

    await authClient().graphql({ query: deleteFinancialSummary, variables: { input: { id: summary.id } } });

    const result = await publicClient().graphql({ query: getFinancialSummary, variables: { id: summary.id } });
    expect((result as any).data.getFinancialSummary).toBeNull();
  });
});

describe('Lambda-backed operations', () => {
  it('calculateFinancialSummary returns numeric fields', async () => {
    await createTestTransaction({
      description: `Summary test income - ${Date.now()}`,
      amount: 1000.00,
      type: TransactionType.INCOME,
      category: 'Salary',
    });

    const result = await publicClient().graphql({ query: calculateFinancialSummary });
    const summary = (result as any).data.calculateFinancialSummary;

    expect(summary).not.toBeNull();
    expect(typeof summary.totalIncome).toBe('number');
    expect(typeof summary.totalExpenses).toBe('number');
    expect(typeof summary.balance).toBe('number');
    expect(typeof summary.savingsRate).toBe('number');
    expect(summary.totalIncome).toBeGreaterThanOrEqual(0);
  });

  it('sendMonthlyReport returns success response', async () => {
    const result = await publicClient().graphql({
      query: sendMonthlyReport,
      variables: { email: 'test@example.com' },
    });
    const report = (result as any).data.sendMonthlyReport;

    expect(report).not.toBeNull();
    expect(typeof report.success).toBe('boolean');
    expect(typeof report.message).toBe('string');
    expect(report.message.length).toBeGreaterThan(0);
  });

  it('sendBudgetAlert returns success response', async () => {
    const result = await publicClient().graphql({
      query: sendBudgetAlert,
      variables: { email: 'test@example.com', category: 'Food', exceeded: 50.00 },
    });
    const alert = (result as any).data.sendBudgetAlert;

    expect(alert).not.toBeNull();
    expect(typeof alert.success).toBe('boolean');
    expect(typeof alert.message).toBe('string');
    expect(alert.message.length).toBeGreaterThan(0);
  });
});

describe('Custom VTL resolver', () => {
  it('getTransactionsByCategory returns filtered transactions', async () => {
    const category = `TestCategory-${Date.now()}`;

    await createTestTransaction({
      description: `Category filter test - ${Date.now()}`,
      amount: 42.00,
      category,
    });

    const result = await publicClient().graphql({
      query: getTransactionsByCategory,
      variables: { category, limit: 1000 },
    });
    const connection = (result as any).data.getTransactionsByCategory;

    expect(connection).not.toBeNull();
    expect(Array.isArray(connection.items)).toBe(true);
    expect(connection.items.length).toBeGreaterThan(0);
    for (const item of connection.items) {
      expect(item.category).toBe(category);
    }
  });
});
