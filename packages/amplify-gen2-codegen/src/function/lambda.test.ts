import ts, { Identifier } from 'typescript';
import assert from 'node:assert';
import { createDefineFunctionCall, DefineFunctionParamter } from './lambda';
import { printNode } from '../test_utils/ts_node_printer';

describe('createDefineFunctionCall', () => {
  it('creates a call expression to defineFunction', () => {
    const fn = createDefineFunctionCall();
    assert(ts.isCallExpression(fn));
    const id: Identifier = fn.expression as Identifier;
    assert.equal(id.escapedText, 'defineFunction');
    assert.equal(fn.arguments.at(0)?.kind, ts.SyntaxKind.ObjectLiteralExpression);
  });
  const parameter: DefineFunctionParamter = {
    runtime: 18,
    memoryMB: 1024,
    timeoutSeconds: '35',
    name: 'my-hello-world',
    entry: './hello-world',
  };
  describe('function parameters', () => {
    it('renders the environment object', () => {
      const environment = {
        hello: 'world',
        foo: 'bar',
      };

      const fn = createDefineFunctionCall({ environment });
      const output = printNode(fn);

      for (const [envKey, envValue] of Object.entries(environment)) {
        assert.match(output, new RegExp(`${envKey}: "${envValue}"`));
      }
      assert.match(output, /environment: \{/);
    });
    for (const [key, value] of Object.entries(parameter)) {
      it(`${key} renders expected value ${value}`, () => {
        const fn = createDefineFunctionCall(parameter);
        const output = printNode(fn);

        assert.match(output, new RegExp(`${key}: "?${value}"?`));
      });
    }
  });
});
