import * as execa from 'execa';
import path from 'path';
import { invoke } from '../../utils/invoke';

jest.setTimeout(60000);
jest.mock('../../utils/invokeUtils', () => ({
  ...(jest.requireActual('../../utils/invokeUtils') as any),
  getLambdaChildProcess: jest.fn().mockImplementation((environment: any, functionName: string = 'execute.js') => {
    return execa.node(path.join(__dirname, '..', '..', '..', 'lib', 'utils', functionName), [], {
      env: environment || {},
    });
  })
}));

describe('test invoke with execute', () => {
  it('should fail with proper error', async () => {
    await expect(invoke({
      packageFolder: __dirname,
      handler: 'handlers.undefinedVariableHandler',
      event: '{}',
      environment: {}
    })).rejects.toMatchObject({
      message: 'undedvar is not defined',
      stack: expect.stringContaining('ReferenceError: undedvar is not defined'),
      type: 'Lambda:Unhandled'
    })
  });

  it('should fail with string error', async () => {
    await expect(invoke({
      packageFolder: __dirname,
      handler: 'handlers.stringErrorHandler',
      event: '{}',
      environment: {}
    })).rejects.toMatchObject({
      type: 'Lambda:Unhandled',
      message: 'Unknown Error'
    });
  });
});
