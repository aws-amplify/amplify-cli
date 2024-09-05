import assert from 'node:assert';
import { FunctionDefinition, renderFunctions } from './source_builder';
import { printNodeArray } from '../test_utils/ts_node_printer';

describe('render function', () => {
  describe('import', () => {
    it('imports defineFunction renderFunction is defined', () => {
      const definitions: FunctionDefinition[] = [];
      const functionDef1: FunctionDefinition = {};
      functionDef1.name = 'function1';
      definitions.push(functionDef1);

      const rendered = renderFunctions(definitions);
      const source = printNodeArray(rendered);

      assert.match(source, /import\s?\{\s?defineFunction\s?\}\s?from\s?"\@aws-amplify\/backend"/);
    });
  });
  describe('does not render', () => {
    it('does not render the properties if its empty', () => {
      const rendered = renderFunctions([{}]);
      const source = printNodeArray(rendered);
      assert.doesNotMatch(source, new RegExp(`entry:`));
    });
  });
  describe('render properties', () => {
    it('does render entry property', () => {
      const definitions: FunctionDefinition[] = [];
      const functionDef1: FunctionDefinition = {};
      functionDef1.entry = 'index.handler';

      definitions.push(functionDef1);

      const rendered = renderFunctions(definitions);
      const source = printNodeArray(rendered);
      assert.match(source, /entry: /);
    });
    it('does render name property', () => {
      const definitions: FunctionDefinition[] = [];
      const functionDef1: FunctionDefinition = {};
      functionDef1.name = 'function1';

      definitions.push(functionDef1);

      const rendered = renderFunctions(definitions);
      const source = printNodeArray(rendered);
      assert.match(source, /name: /);
    });
    it('does render runtime property', () => {
      const definitions: FunctionDefinition[] = [];
      const functionDef1: FunctionDefinition = {};
      functionDef1.runtime = 'nodejs18.x';

      definitions.push(functionDef1);

      const rendered = renderFunctions(definitions);
      const source = printNodeArray(rendered);
      assert.match(source, /runtime: 18/);
    });
    it('does render timeoutSeconds property', () => {
      const definitions: FunctionDefinition[] = [];
      const functionDef1: FunctionDefinition = {};
      functionDef1.timeoutSeconds = 3;

      definitions.push(functionDef1);

      const rendered = renderFunctions(definitions);
      const source = printNodeArray(rendered);
      assert.match(source, /timeoutSeconds: /);
    });
    it('does render memoryMB property', () => {
      const definitions: FunctionDefinition[] = [];
      const functionDef1: FunctionDefinition = {};
      functionDef1.memoryMB = 128;

      definitions.push(functionDef1);

      const rendered = renderFunctions(definitions);
      const source = printNodeArray(rendered);
      assert.match(source, /memoryMB: /);
    });
    it('does render environment property', () => {
      const definitions: FunctionDefinition[] = [];
      const functionDef1: FunctionDefinition = {};
      functionDef1.environment = { Variables: { ENV: 'dev', REGION: 'us-west-2' } };

      definitions.push(functionDef1);

      const rendered = renderFunctions(definitions);
      const source = printNodeArray(rendered);
      assert.match(source, /environment: /);
    });
  });
});
