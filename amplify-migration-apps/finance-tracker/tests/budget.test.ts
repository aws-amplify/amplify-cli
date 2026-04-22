/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateClient } from 'aws-amplify/api';
import { signIn, signOut } from 'aws-amplify/auth';
import { signUp, config } from './signup';
import { getBudget, listBudgets } from '../src/graphql/queries';
import { createBudget, updateBudget, deleteBudget } from '../src/graphql/mutations';

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

describe('Budget', () => {
  let budgetId: string;

  it('creates a budget with correct fields', async () => {
    const input = {
      category: 'Entertainment',
      limit: 200.00,
      month: '2026-04',
    };

    const result = await authClient().graphql({ query: createBudget, variables: { input } });
    const budget = (result as any).data.createBudget;
    budgetId = budget.id;

    expect(typeof budget.id).toBe('string');
    expect(budget.category).toBe('Entertainment');
    expect(budget.limit).toBe(200.00);
    expect(budget.month).toBe('2026-04');
    expect(budget.createdAt).toBeDefined();
  });

  it('reads a budget by id', async () => {
    const result = await publicClient().graphql({ query: getBudget, variables: { id: budgetId } });
    const budget = (result as any).data.getBudget;

    expect(budget).not.toBeNull();
    expect(budget.id).toBe(budgetId);
    expect(budget.category).toBe('Entertainment');
  });

  it('updates a budget limit', async () => {
    await authClient().graphql({
      query: updateBudget,
      variables: { input: { id: budgetId, limit: 300.00 } },
    });

    const result = await publicClient().graphql({ query: getBudget, variables: { id: budgetId } });
    const budget = (result as any).data.getBudget;

    expect(budget.limit).toBe(300.00);
  });

  it('lists budgets', async () => {
    const result = await publicClient().graphql({ query: listBudgets });
    const items = (result as any).data.listBudgets.items;

    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);
  });

  it('deletes a budget', async () => {
    await authClient().graphql({ query: deleteBudget, variables: { input: { id: budgetId } } });

    const result = await publicClient().graphql({ query: getBudget, variables: { id: budgetId } });
    expect((result as any).data.getBudget).toBeNull();
  });
});
