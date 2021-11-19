import { migrateGraphQLSchema } from '../../schema-migrator';
import { parse } from 'graphql';

function migrateAndValidate(inputSchema: string, defaultAuth: string = 'apiKey'): void {
  const docNode = parse(inputSchema);
  const migratedSchema = migrateGraphQLSchema(inputSchema, defaultAuth, docNode);

  parse(migratedSchema);
  expect(migratedSchema).toMatchSnapshot();
}

const API_KEY = 'apiKey';
const USER_POOLS = 'userPools';
const IAM = 'iam';

describe('Schema migration tests for @auth', () => {
  describe('default auth uses api key', () => {
    it('migrates no @auth to public @auth with api key', () => {
      const schema = `
        type Todo @model {
          id: ID!
          name: String!
          description: String
        }`;

      migrateAndValidate(schema, API_KEY);
    });

    it('migrates default api_key auth correctly', () => {
      const schema = `
        type Todo @model {
          id: ID!
          name: String!
          description: String
      }

      type Comment @model @auth(rules: [{ allow: private }]) {
          id: ID!
          content: String!
      }`;

      migrateAndValidate(schema, API_KEY);
    });

    it('migrates @auth to public @auth with api key', () => {
      const schema = `
        type Todo @model @auth(rules: [{ allow: public }]) {
          id: ID!
          name: String!
          description: String
        }`;

      migrateAndValidate(schema, API_KEY);
    });
  });

  describe('default auth is user pools', () => {
    it('migrates @auth private with user pools correctly', () => {
      const schema = `
        type Todo @model @auth(rules: [{ allow: private }]) {
          id: ID!
          name: String!
          description: String
        }`;

      migrateAndValidate(schema, USER_POOLS);
    });
  });

  describe('default auth uses iam', () => {
    it('migrates @auth public with iam correctly', () => {
      const schema = `
        type Todo @model @auth(rules: [{ allow: public, provider: iam }]) {
          id: ID!
          name: String!
          description: String
        }`;

      migrateAndValidate(schema, IAM);
    });

    it('migrates @auth private with iam correctly', () => {
      const schema = `
        type Todo @model @auth(rules: [{ allow: private, provider: iam }]) {
          id: ID!
          name: String!
          description: String
        }`;

      migrateAndValidate(schema, IAM);
    });
  });

  describe('group auth', () => {
    it('retains dynamic groups in auth rules', () => {
      const schema = /* GraphQL */ `
        type Todo @model @auth(rules: [{ allow: groups, groups: ["Admins"] }]) {
          id: ID!
          rating: Int
          title: String
        }
      `;

      migrateAndValidate(schema);
    });

    it('retains groupClaims in auth rules', () => {
      const schema = /* GraphQL */ `
        type Todo
          @model
          @auth(rules: [{ allow: groups, provider: oidc, groups: ["Admins"], groupClaim: "https://myapp.com/claims/groups" }]) {
          id: ID!
          title: String!
        }
      `;

      migrateAndValidate(schema);
    });
  });

  describe('field level auth', () => {
    it('migrates field level correctly', () => {
      const schema = `
        type FieldLevelPost @model {
          id: ID!
          title: String!
          username: String
          ssn: String
            @auth(
              rules: [
                {
                  allow: owner
                  ownerField: "username"
                  identityClaim: "username"
                  operations: [create, read, update, delete]
                }
              ]
            )
        }`;

        migrateAndValidate(schema, API_KEY);
    });

    it('migrates field level auth correctly', () => {
      const schema = `
        type FieldLevelPost @model {
          id: ID!
          title: String!
          username: String
          ssn: String
            @auth(
              rules: [
                {
                  allow: owner
                  ownerField: "username"
                  identityClaim: "username"
                }
              ]
            )
        }`;

        migrateAndValidate(schema, API_KEY);
    });
  });
});
