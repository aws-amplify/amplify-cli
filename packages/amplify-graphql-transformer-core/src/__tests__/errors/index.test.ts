import { parse } from 'graphql';
import { SchemaValidationError } from '../../errors';
import { validateModelSchema } from '../../transformation/validation';

describe('SchemaValidationError', () => {
  describe('when schema has V1 directive', () => {
    it('should print migration related doc when the schema has @hasOne and @hasMany @primaryKey @index directives', () => {
      const schema = parse(/* GraphQL */ `
        type Post @key {
          id: ID!
          title: String!
          blog: Blog! @connection
        }

        type Blog @versioned {
          id: ID!
          name: String!
          posts: [Post]! @connection
        }
      `);
      const errors = validateModelSchema(schema);
      const schemaValidationError = new SchemaValidationError(errors);
      expect(schemaValidationError.message).toEqual(
        'Your GraphQL Schema is using "@key", "@connection", "@versioned" directives from an older version of the GraphQL Transformer. Visit https://docs.amplify.aws/cli/migration/transformer-migration/ to learn how to migrate your GraphQL schema.',
      );
    });
  });

  describe('schema with general error', () => {
    it('should show normal error message when the schema does not have v1 directive error', () => {
      const schema = parse(/* GraphQL */ `
        type Post {
          id: ID!
          title: MissingType
        }
      `);
      const errors = validateModelSchema(schema);
      const schemaValidationError = new SchemaValidationError(errors);
      expect(schemaValidationError.message).toContain(`Unknown type "MissingType".`);
      expect(schemaValidationError.message).not.toContain(
        `Visit https://docs.amplify.aws/cli/migration/transformer-migration/ to learn how to migrate your GraphQL schema.'`,
      );
    });
  });

  describe('schema with general error and v1 directives', () => {
    it('should show normal error message when the schema does not have v1 directive error', () => {
      const schema = parse(/* GraphQL */ `
        type Post {
          id: ID! @connection
          title: MissingType
        }
      `);
      const errors = validateModelSchema(schema);
      const schemaValidationError = new SchemaValidationError(errors);
      expect(schemaValidationError.message).toContain(`Unknown type "MissingType".`);
      expect(schemaValidationError.message).toContain(
        `Visit https://docs.amplify.aws/cli/migration/transformer-migration/ to learn how to migrate your GraphQL schema.`,
      );
    });
  });
});
