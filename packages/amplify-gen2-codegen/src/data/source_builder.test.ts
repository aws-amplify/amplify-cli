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
      const tableMapping = { Todo: 'my-todo-mapping' };
      const source = printNodeArray(generateDataSource({ tableMapping }));
      assert.match(source, /importedAmplifyDynamoDBTableMap: \{\s+Todo: ['"]my-todo-mapping['"]/);
    });
    it('shows each key in the mapping table in the `importedModels` array', () => {
      const tables = ['Todo', 'Foo', 'Bar'];
      const tableMapping = tables.reduce((prev, curr) => ({ ...prev, [curr]: 'baz' }), {});
      const source = printNodeArray(generateDataSource({ tableMapping }));
      const array = source.match(/importedModels:\s+\[(.*?)\]/);
      assert.deepEqual(tables, array?.[1].replaceAll('"', '').split(', '));
    });
    it('has each each key in defineData', () => {
      const tableMapping = { Todo: 'my-todo-mapping' };
      const source = printNodeArray(generateDataSource({ tableMapping }));
      assert.match(
        source,
        /defineData\({\n\s+importedAmplifyDynamoDBTableMap: \{\s+Todo: ['"]my-todo-mapping['"] },\n\s+importedModels:\s+\[.*?\],\n\s+schema: "TODO: Add your existing graphql schema here"\n}\)/,
      );
    });
  });
});
