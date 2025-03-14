import assert from 'node:assert';
import { FunctionDefinition, renderFunctions } from './source_builder';
import { printNodeArray } from '../test_utils/ts_node_printer';
import { Runtime } from '@aws-sdk/client-lambda';

describe('render function', () => {
  describe('import', () => {
    it('imports defineFunction renderFunction is defined', () => {
      const definition: FunctionDefinition = {};
      definition.name = 'function1';

      const rendered = renderFunctions(definition);
      const source = printNodeArray(rendered);

      assert.match(source, /import\s?\{\s?defineFunction\s?\}\s?from\s?"\@aws-amplify\/backend"/);
    });
  });
  describe('does not render', () => {
    it('does not render the properties if its empty', () => {
      const rendered = renderFunctions({});
      const source = printNodeArray(rendered);
      assert.doesNotMatch(source, new RegExp(`entry:`));
      assert.match(source, /throw new Error/);
    });
  });
  describe('render properties', () => {
    it('does render entry property', () => {
      const definition: FunctionDefinition = {};
      definition.entry = 'index.handler';
      definition.name = 'sayHello';

      const rendered = renderFunctions(definition);
      const source = printNodeArray(rendered);
      assert.match(source, /entry: /);
    });
    it('does render name property', () => {
      const definition: FunctionDefinition = {};
      definition.name = 'function1';

      const rendered = renderFunctions(definition);
      const source = printNodeArray(rendered);
      assert.match(source, /name: /);
    });
    test.each([[Runtime.nodejs16x], [Runtime.nodejs18x], [Runtime.nodejs20x], [Runtime.nodejs22x]])('does render runtime property for %s nodejs.', (nodejsRuntime: Runtime) => {
      const definition: FunctionDefinition = {};
      definition.runtime = nodejsRuntime;

      const rendered = renderFunctions(definition);
      const source = printNodeArray(rendered);
      const expectedRuntime = nodejsRuntime.split('nodejs')[1].split('.')[0];
      assert(expectedRuntime);
      assert.match(source, new RegExp(`runtime: ${expectedRuntime}`));
    });

    it('throws error for unsupported nodejs runtime', () => {
      const definition: FunctionDefinition = {};
      definition.runtime = Runtime.nodejs14x;

      assert.throws(() => renderFunctions(definition), /Unsupported nodejs runtime/);
    });
    it('does render timeoutSeconds property', () => {
      const definition: FunctionDefinition = {};
      definition.timeoutSeconds = 3;

      const rendered = renderFunctions(definition);
      const source = printNodeArray(rendered);
      assert.match(source, /timeoutSeconds: /);
    });
    it('does render memoryMB property', () => {
      const definition: FunctionDefinition = {};
      definition.memoryMB = 128;

      const rendered = renderFunctions(definition);
      const source = printNodeArray(rendered);
      assert.match(source, /memoryMB: /);
    });
    it('does render environment property', () => {
      const definition: FunctionDefinition = {};
      definition.environment = { Variables: { ENV: 'dev', REGION: 'us-west-2' } };

      const rendered = renderFunctions(definition);
      const source = printNodeArray(rendered);
      assert.match(source, /environment: /);
    });
  });
});
