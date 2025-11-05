import assert from 'node:assert';
import { printNodeArray } from '../../test_utils/ts_node_printer';
import { generateDataSource } from './index';
describe('Data Category code generation', () => {
  it('generates the correct import', async () => {
    const source = printNodeArray(await generateDataSource());
    assert.match(source, /import\s?\{\s?defineData\s?\}\s?from\s?"\@aws-amplify\/backend"/);
  });
  describe('import map', () => {
    it('is rendered', async () => {
      const tableMappings = { Todo: 'my-todo-mapping' };
      const source = printNodeArray(await generateDataSource({ tableMappings, schema: 'schema' }));
      assert.match(
        source,
        /migratedAmplifyGen1DynamoDbTableMappings: \[\{\n\s+branchName: ['"]\w+['"],\n\s+modelNameToTableNameMapping: { Todo: ['"]my-todo-mapping['"] }\n\s+}]/,
      );
    });
    it('includes multiple models in table mappings', async () => {
      const tableMappings = { Todo: 'Todo-abc123-dev', User: 'User-abc123-dev', Post: 'Post-abc123-dev' };
      const source = printNodeArray(await generateDataSource({ tableMappings, schema: 'schema' }));
      assert.match(
        source,
        /modelNameToTableNameMapping: { Todo: ['"]Todo-abc123-dev['"], User: ['"]User-abc123-dev['"], Post: ['"]Post-abc123-dev['"] }/,
      );
    });
    it('includes a comment for missing table mappings', async () => {
      const source = printNodeArray(await generateDataSource({ schema: 'schema' }));
      assert.match(source, /const schema = `schema`;\n\nexport const data = defineData\(\{\n\s+schema\n\}\)/);
    });
    it('has each each key in defineData', async () => {
      const tableMappings = { Todo: 'my-todo-mapping' };
      const source = printNodeArray(await generateDataSource({ tableMappings, schema: 'schema' }));
      assert.match(
        source,
        /const schema = `schema`;\n\nexport const data = defineData\(\{\n\s+migratedAmplifyGen1DynamoDbTableMappings: \[\{\n\s+branchName: ['"]\w+['"],\n\s+modelNameToTableNameMapping: { Todo: ['"]my-todo-mapping['"] }\n\s+}],\n\s+schema\n\}\)/,
      );
    });
  });
});
