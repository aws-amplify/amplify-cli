import { loadSchema } from '../../../src/generator/utils/loading';
import * as path from 'path';

const FIXTURE_PATH = path.resolve(__dirname, '..', '..', '..', 'fixtures');

describe('loading', () => {
  it('JSON schema', () => {
    const graphqlSchema = loadSchema(path.join(FIXTURE_PATH, 'schema.json'));
    expect(graphqlSchema.constructor.name).toBe('GraphQLSchema');
  });

  it('JSON schema without data property', () => {
    const graphqlSchema = loadSchema(path.join(FIXTURE_PATH, 'schemaWithoutDataProperty.json'));
    expect(graphqlSchema.constructor.name).toBe('GraphQLSchema');
  });

  it('JSON schema file does not exit', () => {
    expect(() => loadSchema('notExists.json')).toThrow('Cannot find GraphQL schema file: notExists.json');
  });

  it('JSON schema file is invalid', () => {
    expect(() => loadSchema(path.join(FIXTURE_PATH, 'invalidSchema.json'))).toThrow(
      'GraphQL schema file should contain a valid GraphQL introspection query result',
    );
  });

  it('empty GraphQL schema', () => {
    const graphqlSchema = loadSchema(path.join(FIXTURE_PATH, 'empty.graphql'));
    expect(graphqlSchema.constructor.name).toBe('GraphQLSchema');
  });
});
