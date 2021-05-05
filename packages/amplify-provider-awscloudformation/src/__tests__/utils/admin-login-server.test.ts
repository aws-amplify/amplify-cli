import { AdminLoginServer } from '../../utils/admin-login-server';
import { $TSContext } from 'amplify-cli-core';

const context_stub = ({} as unknown) as jest.Mocked<$TSContext>;
const useMock = jest.fn();
const postMock = jest.fn(async () => {});
const listenMock = jest.fn();
const serverCloseMock = jest.fn();

jest.mock('express', () => {
  return () => {
    return {
      use: useMock,
      post: postMock,
      listen: listenMock,
    };
  };
});

describe('AdminLoginServer', () => {
  test('run server with 0.0.0.0', async () => {
    const adminLoginServer = new AdminLoginServer('appId', 'http://example.com', context_stub.print);

    await new Promise<void>(resolve => {
      adminLoginServer.startServer(() => {});
      resolve();
    });
    expect(useMock).toBeCalled();
    expect(postMock).toBeCalled();
    expect(listenMock).toBeCalledWith(4242, '0.0.0.0');
  });
  
  test('shut down running server', async () => {
    const adminLoginServer = new AdminLoginServer('appId', 'http://example.com', context_stub.print);
    listenMock.mockReturnValue({ close: serverCloseMock });

    await new Promise<void>(resolve => {
      adminLoginServer.startServer(() => {});
      resolve();
    });
    adminLoginServer.shutdown();
    expect(serverCloseMock).toBeCalled();
  });
});
