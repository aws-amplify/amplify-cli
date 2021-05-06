import { loadSchema } from '../../../src/generator/utils/loading';
import { join } from 'path';

const FIXTURE_PATH = join(__dirname, '/../../../fixtures');

describe('loading', () => {
  it('JSON schema', () => {
    const graphqlSchema = loadSchema(join(FIXTURE_PATH, 'schema.json'));
    expect(graphqlSchema.constructor.name).toBe('GraphQLSchema');
  });

  it('JSON schema without data property', () => {
    const graphqlSchema = loadSchema(join(FIXTURE_PATH, 'schemaWithoutDataProperty.json'));
    expect(graphqlSchema.constructor.name).toBe('GraphQLSchema');
  });

  it('JSON schema file is not exits', () => {
    expect(() => loadSchema('notExists.json')).toThrow('Cannot find GraphQL schema file: notExists.json');
  });

  it('JSON schema file is invalid', () => {
    expect(() => loadSchema(join(FIXTURE_PATH, 'invalidSchema.json'))).toThrow(
      'GraphQL schema file should contain a valid GraphQL introspection query result',
    );
  });

  it('empty GraphQL schema', () => {
    const graphqlSchema = loadSchema(join(FIXTURE_PATH, 'empty.graphql'));
    expect(graphqlSchema.constructor.name).toBe('GraphQLSchema');
  });
});
