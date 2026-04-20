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

const client = () => generateClient({ authMode: 'apiKey' });

beforeAll(async () => {
  const creds = await signUp(config);
  await signIn({ username: creds.username, password: creds.password });
}, 60_000);

afterAll(async () => {
  await signOut();
});

describe('Transaction', () => {
  let transactionId: string;

  it('creates a transaction with correct fields', async () => {
    const input = {
      description: `Grocery shopping - ${Date.now()}`,
      amount: 85.50,
      type: TransactionType.EXPENSE,
      category: 'Food',
      date: new Date().toISOString(),
    };

    const result = await client().graphql({ query: createTransaction, variables: { input } });
    const txn = (result as any).data.createTransaction;
    transactionId = txn.id;

    expect(typeof txn.id).toBe('string');
    expect(txn.id.length).toBeGreaterThan(0);
    expect(txn.description).toBe(input.description);
    expect(txn.amount).toBe(85.50);
    expect(txn.type).toBe(TransactionType.EXPENSE);
    expect(txn.category).toBe('Food');
    expect(txn.createdAt).toBeDefined();
    expect(txn.updatedAt).toBeDefined();
  });

  it('reads a transaction by id', async () => {
    const result = await client().graphql({ query: getTransaction, variables: { id: transactionId } });
    const txn = (result as any).data.getTransaction;

    expect(txn).not.toBeNull();
    expect(txn.id).toBe(transactionId);
    expect(txn.category).toBe('Food');
  });

  it('updates a transaction and persists changes', async () => {
    const updatedDesc = `Updated grocery - ${Date.now()}`;
    await client().graphql({
      query: updateTransaction,
      variables: { input: { id: transactionId, description: updatedDesc, amount: 92.00 } },
    });

    const result = await client().graphql({ query: getTransaction, variables: { id: transactionId } });
    const txn = (result as any).data.getTransaction;

    expect(txn.description).toBe(updatedDesc);
    expect(txn.amount).toBe(92.00);
  });

  it('lists transactions', async () => {
    const result = await client().graphql({ query: listTransactions });
    const items = (result as any).data.listTransactions.items;

    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);
  });

  it('deletes a transaction', async () => {
    await client().graphql({ query: deleteTransaction, variables: { input: { id: transactionId } } });

    const result = await client().graphql({ query: getTransaction, variables: { id: transactionId } });
    expect((result as any).data.getTransaction).toBeNull();
  });
});

describe('FinancialSummary', () => {
  let summaryId: string;

  it('creates a financial summary', async () => {
    const input = {
      totalIncome: 5000.00,
      totalExpenses: 3200.00,
      balance: 1800.00,
      month: '2026-04',
    };

    const result = await client().graphql({ query: createFinancialSummary, variables: { input } });
    const summary = (result as any).data.createFinancialSummary;
    summaryId = summary.id;

    expect(typeof summary.id).toBe('string');
    expect(summary.totalIncome).toBe(5000.00);
    expect(summary.totalExpenses).toBe(3200.00);
    expect(summary.balance).toBe(1800.00);
    expect(summary.month).toBe('2026-04');
    expect(summary.createdAt).toBeDefined();
  });

  it('reads a financial summary by id', async () => {
    const result = await client().graphql({ query: getFinancialSummary, variables: { id: summaryId } });
    const summary = (result as any).data.getFinancialSummary;

    expect(summary).not.toBeNull();
    expect(summary.id).toBe(summaryId);
    expect(summary.month).toBe('2026-04');
  });

  it('lists financial summaries', async () => {
    const result = await client().graphql({ query: listFinancialSummaries });
    const items = (result as any).data.listFinancialSummaries.items;

    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);
  });

  it('deletes a financial summary', async () => {
    await client().graphql({ query: deleteFinancialSummary, variables: { input: { id: summaryId } } });

    const result = await client().graphql({ query: getFinancialSummary, variables: { id: summaryId } });
    expect((result as any).data.getFinancialSummary).toBeNull();
  });
});

describe('Lambda-backed operations', () => {
  it('calculateFinancialSummary returns numeric fields', async () => {
    // Create a transaction so the summary has data to work with
    await client().graphql({
      query: createTransaction,
      variables: {
        input: {
          description: `Summary test income - ${Date.now()}`,
          amount: 1000.00,
          type: TransactionType.INCOME,
          category: 'Salary',
          date: new Date().toISOString(),
        },
      },
    });

    const result = await client().graphql({ query: calculateFinancialSummary });
    const summary = (result as any).data.calculateFinancialSummary;

    expect(summary).not.toBeNull();
    expect(typeof summary.totalIncome).toBe('number');
    expect(typeof summary.totalExpenses).toBe('number');
    expect(typeof summary.balance).toBe('number');
    expect(typeof summary.savingsRate).toBe('number');
    expect(summary.totalIncome).toBeGreaterThanOrEqual(0);
  });

  it('sendMonthlyReport returns success response', async () => {
    const result = await client().graphql({
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
    const result = await client().graphql({
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

    // Create a transaction with a unique category
    await client().graphql({
      query: createTransaction,
      variables: {
        input: {
          description: `Category filter test - ${Date.now()}`,
          amount: 42.00,
          type: TransactionType.EXPENSE,
          category,
          date: new Date().toISOString(),
        },
      },
    });

    const result = await client().graphql({
      query: getTransactionsByCategory,
      variables: { category, limit: 10 },
    });
    const connection = (result as any).data.getTransactionsByCategory;

    expect(connection).not.toBeNull();
    expect(Array.isArray(connection.items)).toBe(true);
    expect(connection.items.length).toBeGreaterThan(0);
    // All returned items should match the requested category
    for (const item of connection.items) {
      expect(item.category).toBe(category);
    }
  });
});
