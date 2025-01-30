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
        /importedAmplifyDynamoDBTableMap: \{\s+\n\s+\/\/ Replace the environment name \(dev\) with the corresponding branch name. Use ['"]sandbox['"] for your sandbox environment.\n\s+dev: { Todo: ['"]my-todo-mapping['"] } }/,
      );
    });
    it('has each each key in defineData', () => {
      const tableMappings = { dev: { Todo: 'my-todo-mapping' } };
      const source = printNodeArray(generateDataSource({ tableMappings }));
      assert.match(
        source,
        /defineData\({\n\s+importedAmplifyDynamoDBTableMap: \{\s+\n\s+\/\/ Replace the environment name \(dev\) with the corresponding branch name. Use \"sandbox\" for your sandbox environment.\n\s+dev: { Todo: ['"]my-todo-mapping['"] } },\n\s+schema: "TODO: Add your existing graphql schema here"\n}\)/,
      );
    });
  });
});
