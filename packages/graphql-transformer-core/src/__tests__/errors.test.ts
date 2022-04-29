import { parse } from 'graphql';
import { SchemaValidationError } from '../errors';
import { validateModelSchema } from '../validation';

describe('SchemaValidationError', () => {
  describe('Schema has only V2 directive errors', () => {
    it('should print migration related doc when the schema has @hasOne and @hasMany @primaryKey @index directives', () => {
      const schema = parse(/* GraphQL */ `
        type Post {
          id: ID! @primaryKey
          title: String! @index
          blog: Blog! @hasOne
        }

        type Blog {
          id: ID!
          name: String!
          posts: [Post]! @hasMany
        }
      `);
      const errors = validateModelSchema(schema);
      const schemaValidationError = new SchemaValidationError(errors);
      expect(schemaValidationError.message).toEqual(
        'Your GraphQL Schema is using "@primaryKey", "@index", "@hasOne", "@hasMany" directives from the newer version of the GraphQL Transformer. Visit https://docs.amplify.aws/cli/migration/transformer-migration/ to learn how to migrate your GraphQL schema.',
      );
    });

    it('should print migration related doc when the schema has @default directive', () => {
      const schema = parse(/* GraphQL */ `
        type Post {
          id: ID!
          title: String! @default
        }
      `);
      const errors = validateModelSchema(schema);
      const schemaValidationError = new SchemaValidationError(errors);
      expect(schemaValidationError.message).toEqual(
        'Your GraphQL Schema is using "@default" directive from the newer version of the GraphQL Transformer. Visit https://docs.amplify.aws/cli/migration/transformer-migration/ to learn how to migrate your GraphQL schema.',
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

  describe('schema with general error and v2 directive error', () => {
    it('should show normal error message when the schema does not have v1 directive error', () => {
      const schema = parse(/* GraphQL */ `
        type Post {
          id: ID! @primaryKey
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
