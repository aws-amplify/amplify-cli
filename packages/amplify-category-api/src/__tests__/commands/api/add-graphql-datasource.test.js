const { readSchema } = require('../../../commands/api/add-graphql-datasource');
const path = require('path');

describe('read schema', () => {
  it('Valid schema present in folder', async () => {
    const graphqlSchemaPath = path.join(__dirname, 'mock-data', 'schema.graphql');
    expect(readSchema(graphqlSchemaPath)).toBeDefined();
  });

  it('Invalid schema present in folder', async () => {
    function invalidSchema() {
      const graphqlSchemaPath = path.join(__dirname, 'mock-data', 'invalid_schema.graphql');
      readSchema(graphqlSchemaPath);
    }
    expect(invalidSchema).toThrowError('Could not parse graphql schema');
  });

  it('Empty schema present in folder', async () => {
    const graphqlSchemaPath = path.join(__dirname, 'mock-data', 'empty_schema.graphql');
    expect(readSchema(graphqlSchemaPath)).toBeNull();
  });
});
