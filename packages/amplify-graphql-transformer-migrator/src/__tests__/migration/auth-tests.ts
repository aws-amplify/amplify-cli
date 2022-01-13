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
const OIDC = 'oidc';

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

      describe('custom identity claim', () => {
        it('migrates identity claim', () => {
          const schema = `
            type Todo
              @model
              @auth(rules: [{ allow: owner, identityClaim: "sub" }]) {
                id: ID!
                title: String!
                owner: String
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

      describe('with explicit operations', () => {
        it('migrates create + delete -> private read + update', () => {
          const schema = `
            type Todo
              @model
              @auth(rules: [{ allow: groups, groups: ["Admins"], operations: [create, delete] }]) {
                id: ID!
                rating: Int
                title: String
              }`;

          migrateAndValidate(schema, USER_POOLS);
        });
      });

      it('migrate dynamic user pool', () => {
        const schema = `
          type Todo
            @model
            @auth(rules: [
              { allow: groups, groupsField: "groups" }
            ]) {
              id: ID!
              title: String
              groups: [String]
            }
          type Task
            @model
            @auth(rules: [{ allow: groups, groupsField: "group" }]) {
              id: ID!
              title: String
              group: String
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

  describe('default auth uses oidc', () => {
    it('ports over oidc w/ owner as expected', () => {
      const schema = `
        type Todo
          @model
          @auth(rules: [{ allow: owner, provider: oidc, identityClaim: "sub" }]) {
            id: ID!
            title: String!
          }`;

      migrateAndValidate(schema, OIDC);
    });

    it('migrates over oidc w/ owner and operations', () => {
      const schema = `
        type Todo
          @model
          @auth(rules: [{ allow: owner, provider: oidc, identityClaim: "sub", operations: [update] }]) {
            id: ID!
            title: String!
          }`;

      migrateAndValidate(schema, OIDC);
    });

    it('migrates oidc w/ groups as expected', () => {
      const schema = `
        type Todo
          @model
          @auth(
            rules: [
              {
                allow: groups
                provider: oidc
                groups: ["Admins"]
                groupClaim: "https://myapp.com/claims/groups"
              }
            ]
          ) {
            id: ID!
            title: String!
          }`;

      migrateAndValidate(schema, OIDC);
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

    it('ports over owner and group based rule', () => {
      const schema = `
        type Todo
          @model
          @auth (rules: [
            { allow: owner },
            { allow: groups, groups: ["Admins"] }
          ]) {
            id: ID!
            name: String!
            description: String
            owner: String
          }`;

      migrateAndValidate(schema);
    });
  });

  describe('field level auth', () => {
    it('keeps type auth and field auth', () => {
      const schema = `
        type Todo @model {
          id: ID!
          title: String!
          ssn: String @auth(rules: [{ allow: owner }])
        }`;

      migrateAndValidate(schema, API_KEY);
    });

    it('migrates field level correctly with explicit operations', () => {
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

  describe('relational auth', () => {
    it('migrates as expected', () => {
      const schema = `
        type Post
            @model
            @auth(rules: [{ allow: owner }])
            @key(name: "byOwner", fields: ["owner", "id"])
        {
            id: ID!
            title: String!
            author: User @connection(fields: ["owner"])
            owner: ID!
        }
        type User @model @auth(rules: [{ allow: owner }]) {
            id: ID!
            posts: [Post] @connection(keyName: "byOwner", fields: ["id"])
        }
        type FieldProtected @model {
            id: ID!
            owner: String
            ownerOnly: String @auth(rules: [{ allow: owner }])
        }
        type OpenTopLevel @model {
            id: ID!
            name: String
            owner: String
            protected: [ConnectionProtected] @connection(keyName: "byTopLevel", fields: ["id"])
        }
        type ConnectionProtected
            @model(queries: null)
            @auth(rules: [{ allow: owner }])
            @key(name: "byTopLevel", fields: ["topLevelID", "id"])
        {
            id: ID!
            name: String
            owner: String
            topLevelID: ID!
            topLevel: OpenTopLevel @connection(fields: ["topLevelID"])
        }`;

      migrateAndValidate(schema, USER_POOLS);
    });
  });
});
