import { migrateGraphQLSchema } from '../../migration/migrate';
import { parse } from 'graphql/language';

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

    it('Should match expected output for extended Todo and API key', () => {
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
  });
});
