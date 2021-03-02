import * as path from 'path';
import { invoke } from '../../utils/invoke';

jest.mock('../../utils/executorPath', () => ({
  executorPath: path.resolve(path.join(__dirname, '../../../lib/utils/execute.js')),
}));

const stubObjectEvent = {
  test: 'event',
};

const stubStringEvent = 'test event';

const invokeOpts = (name: string) => ({
  handler: `handlers.${name}`,
  packageFolder: __dirname,
  event: JSON.stringify(stubStringEvent),
});

const objectEvent = {
  event: JSON.stringify(stubObjectEvent),
};

describe('invoke async func', () => {
  it('handles object return val', async () => {
    const result = await invoke({
      ...invokeOpts('asyncReturnEvent'),
      ...objectEvent,
    });
    expect(result).toEqual(stubObjectEvent);
  });

  it('handles string return val', async () => {
    const result = await invoke({
      ...invokeOpts('asyncReturnEvent'),
    });
    expect(result).toEqual(stubStringEvent);
  });

  it('handles undefined return val', async () => {
    const result = await invoke({
      ...invokeOpts('asyncReturnUndefined'),
      ...objectEvent,
    });
    expect(result).toBeNull();
  });

  it('handles null return val', async () => {
    const nullEvent = null;
    const result = await invoke({
      ...invokeOpts('asyncReturnEvent'),
      event: JSON.stringify(nullEvent),
    });
    expect(result).toEqual(nullEvent);
  });

  it('handles large data returned', async () => {
    const result = await invoke(invokeOpts('asyncReturnLargeData'));
    const { expectedLargeData } = require('./handlers');
    expect(result).toEqual(expectedLargeData);
  });

  it('handles error thrown', () => {
    return expect(invoke(invokeOpts('asyncRejectWithError'))).rejects.toThrowErrorMatchingInlineSnapshot(`"asyncRejectWithError failure"`);
  });

  it('handles string thrown', () => {
    return expect(invoke(invokeOpts('asyncRejectWithString'))).rejects.toMatchInlineSnapshot(`"asyncRejectWithString failure"`);
  });
});

describe('invoke callback func', () => {
  it('handles object returned', async () => {
    const result = await invoke({
      ...invokeOpts('callbackReturnEvent'),
      event: JSON.stringify(objectEvent),
    });

    expect(result).toEqual(objectEvent);
  });

  it('handles error object', () => {
    return expect(invoke(invokeOpts('callbackRejectWithError'))).rejects.toThrowErrorMatchingInlineSnapshot(
      `"callbackRejectWithError failure"`,
    );
  });

  it('handles error string', () => {
    return expect(invoke(invokeOpts('callbackRejectWithString'))).rejects.toMatchInlineSnapshot(`"callbackRejectWithString failure"`);
  });

  it('handles error thrown', () => {
    return expect(invoke(invokeOpts('syncRejectWithError'))).rejects.toThrowErrorMatchingInlineSnapshot(`"syncRejectWithError failure"`);
  });

  it('handles string thrown', () => {
    return expect(invoke(invokeOpts('syncRejectWithString'))).rejects.toMatchInlineSnapshot(`"syncRejectWithString failure"`);
  });
});

describe('invoke invalid func', () => {
  it('handles reference error', () => {
    return expect(invoke(invokeOpts('referenceError'))).rejects.toThrowErrorMatchingInlineSnapshot(`"console.dne is not a function"`);
  });

  it('handles function does not exist', () => {
    return expect(invoke(invokeOpts('doesntExist'))).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Could not load lambda handler function due to Error: Lambda handler handlers has no exported function named doesntExist"`,
    );
  });

  it('handles syntax error', async () => {
    return expect(
      invoke({
        handler: 'handlerWithSyntaxError.syntaxError',
        packageFolder: __dirname,
        ...objectEvent,
      }),
    ).rejects.toMatchObject({
      message: /Could not load lambda handler function due to SyntaxError: Unexpected token.*/,
    });
  });
});
