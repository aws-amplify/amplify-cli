import { migrateGraphQLSchema } from '../../migration/migrate';
import { parse } from 'graphql';

describe('Schema migration tests', () => {
  describe('Schema conversion tests', () => {
    it('Should match expected output for base Todo and API key', () => {
      const schema = /* graphql */
      `type Todo @model {
        id: ID!
        name: String!
        description: String
      }
      `;
      const outputSchema = /* graphql */
`type Todo @model @auth(rules: [{allow: public}]) {
  id: ID!
  name: String!
  description: String
}
`;
      const docNode = parse(schema);
      const newSchema = migrateGraphQLSchema(schema, 'apiKey', docNode);
      expect(newSchema).toMatch(outputSchema);
    });

    it('Should match expected output for extended Todo and API key', async () => {
      const schema = /* graphql */
      `type Todo @model {
        id: ID!
        name: String!
        description: String
      }
      
      type Ope @model {
        foo: ID!
        bar: String
      }
`;
      const outputSchema = /* graphql */
`type Todo @model @auth(rules: [{allow: public}]) {
  id: ID!
  name: String!
  description: String
}

type Ope @model @auth(rules: [{allow: public}]) {
  foo: ID!
  bar: String
}
`;
      const docNode = parse(schema);
      const newSchema = migrateGraphQLSchema(schema, 'apiKey', docNode);
      expect(newSchema).toMatch(outputSchema);
    });

    it('Should blow up if we try to use versioned', () => {
      const schema = /* graphql */
        `type Todo @model @versioned {
        id: ID!
        name: String!
        description: String
      }
      
      type Ope @model {
        foo: ID!
        bar: String
      }
`;

      const docNode = parse(schema);
      expect(() => migrateGraphQLSchema(schema, 'apiKey', docNode)).toThrowError();
    });

    it('Should migrate a primary key', () => {
      const schema = /* graphql */
        `type Todo @model
                   @key(fields: ["id"]) {
        id: ID!
        name: String!
        description: String
      }
      
      type Ope @model {
        foo: ID!
        bar: String
      }
`;
      const outputSchema = /* graphql */
        `type Todo @model @auth(rules: [{allow: public}]) {
  id: ID! @primaryKey
  name: String!
  description: String
}

type Ope @model @auth(rules: [{allow: public}]) {
  foo: ID!
  bar: String
}
`;
      const docNode = parse(schema);
      const newSchema = migrateGraphQLSchema(schema, 'apiKey', docNode);
      expect(newSchema).toMatch(outputSchema);
    });

    it('Should migrate a secondary key', () => {
      const schema = /* graphql */
        `type Todo @model
                   @key(name: "nameIndex", fields: ["name"]) {
        id: ID!
        name: String!
        description: String
      }
      
      type Ope @model {
        foo: ID!
        bar: String
      }
`;
      const outputSchema = /* graphql */
        `type Todo @model @auth(rules: [{allow: public}]) {
  id: ID!
  name: String! @index(name: "nameIndex")
  description: String
}

type Ope @model @auth(rules: [{allow: public}]) {
  foo: ID!
  bar: String
}
`;
      const docNode = parse(schema);
      const newSchema = migrateGraphQLSchema(schema, 'apiKey', docNode);
      expect(newSchema).toMatch(outputSchema);
    });

    it('Relational docs primary key', () => {
      const schema = /* graphql */
        `type Customer @model @key(fields: ["email"]) {
          email: String!
          username: String
        }
`;
      const outputSchema = /* graphql */
`type Customer @model @auth(rules: [{allow: public}]) {
  email: String! @primaryKey
  username: String
}
`;
      const docNode = parse(schema);
      const newSchema = migrateGraphQLSchema(schema, 'apiKey', docNode);
      expect(newSchema).toMatch(outputSchema);
    });

    it('Relational docs secondary key', () => {
      const schema = /* graphql */
      `type Todo @model
        @key(name: "todosByStatus", fields: ["status"], queryField: "listTodosByStatus") {
        id: ID!
        name: String!
        status: String!
      }
`;
      const outputSchema = /* graphql */
`type Todo @model @auth(rules: [{allow: public}]) {
  id: ID!
  name: String!
  status: String! @index(name: "todosByStatus", queryField: "listTodosByStatus")
}
`;
      const docNode = parse(schema);
      const newSchema = migrateGraphQLSchema(schema, 'apiKey', docNode);
      expect(newSchema).toMatch(outputSchema);
    });

    it('Relational docs has one', () => {
      const schema = /* graphql */
      `type Project @model {
        id: ID!
        name: String
        team: Team @connection
      }
      
      type Team @model {
        id: ID!
        name: String!
      }
`;
      const outputSchema = /* graphql */
`type Project @model @auth(rules: [{allow: public}]) {
  id: ID!
  name: String
  team: Team @hasOne
}

type Team @model @auth(rules: [{allow: public}]) {
  id: ID!
  name: String!
}
`;
      const docNode = parse(schema);
      const newSchema = migrateGraphQLSchema(schema, 'apiKey', docNode);
      expect(newSchema).toMatch(outputSchema);
    });

    it('Relational docs has many', () => {
      const schema = /* graphql */
      `type Post @model {
        id: ID!
        title: String!
        comments: [Comment] @connection(keyName: "byPost", fields: ["id"])
      }
      
      type Comment @model
        @key(name: "byPost", fields: ["postID", "content"]) {
        id: ID!
        postID: ID!
        content: String!
      }
`;
      const outputSchema = /* graphql */
`type Post @model @auth(rules: [{allow: public}]) {
  id: ID!
  title: String!
  comments: [Comment] @hasMany(indexName: "byPost", fields: ["id"])
}

type Comment @model @auth(rules: [{allow: public}]) {
  id: ID!
  postID: ID! @index(name: "byPost", sortKeyFields: ["content"])
  content: String!
}
`;
      const docNode = parse(schema);
      const newSchema = migrateGraphQLSchema(schema, 'apiKey', docNode);
      expect(newSchema).toMatch(outputSchema);
    });
  });
});
