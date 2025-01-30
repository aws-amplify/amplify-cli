import assert from 'node:assert';
import { printNodeArray } from '../test_utils/ts_node_printer';
import { generateDataSource, schemaPlaceholderComment } from './source_builder';
describe('Data Category code generation', () => {
  it('generates the schema placeholder comment', () => {
    const source = printNodeArray(generateDataSource());
    assert.match(source, new RegExp(`schema: "${schemaPlaceholderComment}"`));
  });
  it('generates the TODO error for the schema', () => {
    const source = printNodeArray(generateDataSource());
    assert.match(source, /throw new Error\("TODO: Add Gen 1 GraphQL schema"\)/);
  });
  it('generates the correct import', () => {
    const source = printNodeArray(generateDataSource());
    assert.match(source, /import\s?\{\s?defineData\s?\}\s?from\s?"\@aws-amplify\/backend"/);
  });
  describe('import map', () => {
    it('is rendered', () => {
      const tableMappings = { dev: { Todo: 'my-todo-mapping' } };
      const source = printNodeArray(generateDataSource({ tableMappings }));
      assert.match(
        source,
        /\/\/ Replace each environment name with the corresponding branch name. Use ['"]sandbox['"] for your sandbox environment.\n\s+importedAmplifyDynamoDBTableMap: \{\s+dev: { Todo: ['"]my-todo-mapping['"] } }/,
      );
    });
    it('includes multiple table mappings', () => {
      const tableMappings = {
        dev: { Todo: 'my-todo-mapping' },
        prod: { Todo: 'my-todo-mapping-prod' },
      };
      const source = printNodeArray(generateDataSource({ tableMappings }));
      assert.match(
        source,
        /importedAmplifyDynamoDBTableMap: \{\s+dev: { Todo: ['"]my-todo-mapping['"] }, prod: { Todo: ['"]my-todo-mapping-prod['"] } }/,
      );
    });
    it('includes a comment for missing table mappings', () => {
      const tableMappings = {
        dev: undefined,
      };
      const source = printNodeArray(generateDataSource({ tableMappings }));
      assert.match(
        source,
        /\/\*\*\n\s+\* Unable to find the table mapping for this environment.\n\s+\* This could be due the enableGen2Migration feature flag not being set to true for this environment.\n\s+\* Please enable the feature flag and push the backend resources.\n\s+\* If you are not planning to migrate this environment, you can remove this key.\n\s+\*\/\n\s+dev: {}/,
      ); //\s+dev: {}/);
    });
    it('has each each key in defineData', () => {
      const tableMappings = { dev: { Todo: 'my-todo-mapping' } };
      const source = printNodeArray(generateDataSource({ tableMappings }));
      assert.match(
        source,
        /defineData\({\n\s+\/\/ Replace each environment name with the corresponding branch name. Use ['"]sandbox['"] for your sandbox environment.\n\s+importedAmplifyDynamoDBTableMap: \{\s+dev: { Todo: ['"]my-todo-mapping['"] } },\n\s+schema: "TODO: Add your existing graphql schema here"\n}\)/,
      );
    });
  });
});
