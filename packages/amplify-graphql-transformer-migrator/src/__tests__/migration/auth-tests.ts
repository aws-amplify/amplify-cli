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

    describe('owner based auth', () => {
      describe('implicit owner field', () => {
        it('migrates @auth with owners correctly', () => {
          const schema = `
            type Todo @model @auth(rules: [{ allow: owner }]) {
              id: ID!
              name: String!
              description: String
            }`;

          migrateAndValidate(schema, USER_POOLS);
        });

        it('migrates @auth with owners and field correctly', () => {
          const schema = `
            type Todo @model @auth(rules: [{ allow: owner, ownerField: "editor" }]) {
              id: ID!
              name: String!
              description: String
            }`;

          migrateAndValidate(schema, USER_POOLS);
        });
      });

      describe('explicit owner field', () => {
        it('migrates @auth with owners correctly', () => {
          const schema = `
            type Todo @model @auth(rules: [{ allow: owner }]) {
              id: ID!
              name: String!
              description: String
              owner: String
            }`;

          migrateAndValidate(schema, USER_POOLS);
        });

        it('migrates @auth with custom owner field correctly', () => {
          const schema = `
            type Todo @model @auth(rules: [{ allow: owner, ownerField: "editor" }]) {
              id: ID!
              name: String!
              description: String
              editor: String
            }`;

          migrateAndValidate(schema, USER_POOLS);
        });
      });

      describe('explicit operations', () => {
        it('adds private update rule', () => {
          const schema = `
            type Todo
              @model
              @auth(rules: [{ allow: owner, operations: [create, read, delete] }]) {
                id: ID!
                rating: Int
                title: String
              }`;

          migrateAndValidate(schema, USER_POOLS);
        });

        it('adds private delete rule', () => {
          const schema = `
            type Todo
              @model
              @auth(rules: [{ allow: owner, operations: [create, delete] }]) {
                id: ID!
                rating: Int
                title: String
              }`;

          migrateAndValidate(schema, USER_POOLS);
        });
      });

      describe('multiple owner rules', () => {
        it('retains the owner operations', () => {
          const schema = `
            type Todo
              @model
              @auth(rules: [
                { allow: owner, operations: [create] },
                { allow: owner, ownerField: "admin", operations: [read, update, delete] }
              ]) {
                id: ID!
                title: String!
                admin: String
                owner: String
              }`;
          migrateAndValidate(schema, USER_POOLS);
        });
      });

      describe('array of owners', () => {
        it('migrates owner array fields correctly', () => {
          const schema = `
            type Todo
              @model
              @auth(rules: [{ allow: owner, ownerField: "editors" }]) {
                id: ID!
                rating: Int
                title: String
                editors: [String]
              }`;

          migrateAndValidate(schema, USER_POOLS);
        });
      });
    });

    describe('group based auth', () => {
      it('migrates @auth with groups correctly', () => {
        const schema = `
          type Todo @model @auth(rules: [{ allow: groups, groups: ["Admins"] }]) {
            id: ID!
            name: String!
            description: String
          }`;

        migrateAndValidate(schema, USER_POOLS);
      });
    });

    describe('multi-use for user groups', () => {
      it('migrates non specified @auth correctly', () => {
        const schema = `
        type Todo @model @auth(rules: [{ allow: owner }]) {
          id: ID!
          name: String!
          description: String
        }

        type Task @model {
          id: ID!
          title: String!
          owner: String
        }`;

        migrateAndValidate(schema, USER_POOLS);
      });
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

    describe('multi field auth', () => {
      it('migrates correctly', () => {
        const schema = `
          type Employee @model (
            subscriptions: {
              level: public
            }
          ) @auth(rules: [
            { allow: owner, ownerField: "e_mail", operations: [update] },
            { allow: groups, groups: ["Admin"], operations: [create, update, delete] }
          ]) {
            e_mail: String @auth(rules: [
              { allow: groups, groups: ["Admin"], operations: [create, update, read] }
              { allow: owner, ownerField: "e_mail", operations: [read] }
            ])
            salary: Int @auth(rules: [
              { allow: groups, groups: ["Admin"], operations: [create, update, read] }
              { allow: owner, ownerField: "e_mail", operations: [read] }
            ])
            notes: String @auth(rules: [{ allow: owner, ownerField: "e_mail", operations: [delete] }])
          }`;

        migrateAndValidate(schema, USER_POOLS);
      });
    });
  });
});
