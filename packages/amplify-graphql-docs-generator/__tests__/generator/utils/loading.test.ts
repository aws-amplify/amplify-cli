import { loadSchema } from '../../../src/generator/utils/loading';

describe('loading', () => {
  it('JSON schema', () => {
    const graphqlSchema = loadSchema(__dirname + '/../../../fixtures/schema.json');
    expect(graphqlSchema.constructor.name).toBe('GraphQLSchema');
  });

  it('JSON schema without data property', () => {
    const graphqlSchema = loadSchema(__dirname + '/../../../fixtures/schemaWithoutDataProperty.json');
    expect(graphqlSchema.constructor.name).toBe('GraphQLSchema');
  });
  it('JSON schema file is not exits', () => {
    expect(() => loadSchema('notExists.json')).toThrow('Cannot find GraphQL schema file: notExists.json');
  });

  it('JSON schema file is invalid', () => {
    expect(() => loadSchema(__dirname + '/../../../fixtures/invalidSchema.json')).toThrow(
      'GraphQL schema file should contain a valid GraphQL introspection query result',
    );
  });
  it('empty GraphQL schema', () => {
    const graphqlSchema = loadSchema(__dirname + '/../../../fixtures/empty.graphql');
    expect(graphqlSchema.constructor.name).toBe('GraphQLSchema');
  });
});
