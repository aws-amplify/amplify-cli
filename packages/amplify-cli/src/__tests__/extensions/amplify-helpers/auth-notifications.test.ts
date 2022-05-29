import { collectDirectivesByType } from 'graphql-transformer-core';
import { displayAuthNotification, hasFieldAuthDirectives } from '../../../extensions/amplify-helpers/auth-notifications';
import { parse } from 'graphql';
import { FeatureFlags } from 'amplify-cli-core';

jest.mock('amplify-cli-core');

const FeatureFlags_mock = FeatureFlags as jest.Mocked<typeof FeatureFlags>;
FeatureFlags_mock.getNumber.mockReturnValue(2);

describe('displayAuthNotification', () => {
  it('level "off" returns true', () => {
    const map: any = collectDirectivesByType(`
      type MyModel @model(subscriptions: { level: off }) {
        id: ID!
      }
    `);
    const set: Set<string> = new Set(['MyModel']);

    expect(displayAuthNotification(map, set)).toBe(true);
  });

  it('level "null" returns true', () => {
    const map: any = collectDirectivesByType(`
      type MyModel @model(subscriptions: { level: null }) {
        id: ID!
      }
    `);
    const set: Set<string> = new Set(['MyModel']);

    expect(displayAuthNotification(map, set)).toBe(true);
  });

  it('subscriptions is null returns true', () => {
    const map: any = collectDirectivesByType(`
      type MyModel @model(subscriptions: null) {
        id: ID!
      }
    `);
    const set: Set<string> = new Set(['MyModel']);

    expect(displayAuthNotification(map, set)).toBe(true);
  });

  it('"public" returns false', () => {
    const map: any = collectDirectivesByType(`
      type MyModel @model(subscriptions: { level: public }) {
        id: ID!
      }
    `);
    const set: Set<string> = new Set(['MyModel']);

    expect(displayAuthNotification(map, set)).toBe(false);
  });

  it('"on" returns false', () => {
    const map: any = collectDirectivesByType(`
      type MyModel @model(subscriptions: { level: on }) {
        id: ID!
      }
    `);
    const set: Set<string> = new Set(['MyModel']);

    expect(displayAuthNotification(map, set)).toBe(false);
  });

  it('absent value returns false', () => {
    const map: any = collectDirectivesByType(`
      type MyModel @model {
        id: ID!
      }
    `);
    const set: Set<string> = new Set(['MyModel']);

    expect(displayAuthNotification(map, set)).toBe(false);
  });
});

describe('hasFieldAuthDirectives', () => {
  it('returns types with field auth directives', () => {
    const doc = parse(`
      type TypeWithFieldAuth @auth(rules: { allow: private, operations: [read] }) {
        fieldWithAuth: String! @auth(rules: { allow: groups, group: "admin" })
      }

      type TypeWithoutFieldAuth @auth(rules: { allow: private, operations: [read] }) {
        fieldWithoutAuth: String!
      }
    `);

    const result = hasFieldAuthDirectives(doc);

    expect(result).toContain('TypeWithFieldAuth');
    expect(result).not.toContain('TypeWithoutFieldAuth');
  });

  it('returns empty set when no field auth', () => {
    const doc = parse(`
      type TypeWithoutFieldAuth @auth(rules: { allow: private, operations: [read] }) {
        fieldWithoutAuth: String!
      }
    `);

    const result = hasFieldAuthDirectives(doc);
    expect(result.size).toBe(0);
  });

  it('returns empty set with nullable and field auth', () => {
    const doc = parse(`
      type TypeWithFieldAuth @auth(rules: { allow: private, operations: [read] }) {
        fieldWithAuth: String @auth(rules: { allow: groups, group: "admin" })
      }
    `);

    const result = hasFieldAuthDirectives(doc);
    expect(result.size).toBe(0);
  });
});
