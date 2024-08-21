import ts from 'typescript';
import assert from 'node:assert';
import { TypescriptNodeArrayRenderer } from './typescript_block_node';

describe('TypescriptBlockNodeRenderer', () => {
  const createConsoleLogHelloWorldBlock = () => {
    const consoleArgs = [ts.factory.createStringLiteral('hello, world')];
    const consoleIdentifier = ts.factory.createIdentifier('console');
    const consoleLog = ts.factory.createPropertyAccessExpression(consoleIdentifier, 'log');
    const expression = ts.factory.createCallExpression(consoleLog, undefined, consoleArgs);
    const statement = ts.factory.createExpressionStatement(expression);
    return ts.factory.createNodeArray([statement], true);
  };
  it('trims the first and last line brackets', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const writer = jest.fn(async (_: string) => {});
    const renderer = new TypescriptNodeArrayRenderer(async () => createConsoleLogHelloWorldBlock(), writer);
    await renderer.render();
    assert(writer.mock.calls[0][0].includes('console.log("hello, world");'));
  });
});
