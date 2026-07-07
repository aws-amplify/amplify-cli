import { AdminLoginServer } from '../../utils/admin-login-server';
import { printer } from '@aws-amplify/amplify-prompts';

const useMock = jest.fn();
const postMock = jest.fn(async () => {});
const getMock = jest.fn(async () => {});
const listenMock = jest.fn();
const serverCloseMock = jest.fn();

jest.mock('express', () => () => ({
  use: useMock,
  post: postMock,
  get: getMock,
  listen: listenMock,
}));

describe('AdminLoginServer', () => {
  test('run server with 0.0.0.0', async () => {
    const adminLoginServer = new AdminLoginServer('appId', 'http://example.com', printer);

    await adminLoginServer.startServer(() => {});

    expect(useMock).toBeCalled();
    expect(postMock).toBeCalled();
    expect(getMock).toBeCalled();
    expect(listenMock).toBeCalledWith(4242, '0.0.0.0');
  });

  test('shut down running server', async () => {
    const adminLoginServer = new AdminLoginServer('appId', 'http://example.com', printer);
    listenMock.mockReturnValue({ close: serverCloseMock });

    await adminLoginServer.startServer(() => {});
    adminLoginServer.shutdown();
    expect(serverCloseMock).toBeCalled();
  });
});
