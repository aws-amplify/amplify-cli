import assert from 'node:assert';
import { printNode } from './test_utils/ts_node_printer';
import { createTodoError } from './todo_error';

describe('TODO error', () => {
  it('prepends TODO: to the message text', () => {
    const message = 'helloWorld';
    const source = printNode(createTodoError(message));
    assert.match(source, new RegExp(`TODO: ${message}`));
  });
  it('creates the correct throws syntax', () => {
    const source = printNode(createTodoError(''));
    assert.match(source, /throw new Error\("TODO: "\)/);
  });
});
