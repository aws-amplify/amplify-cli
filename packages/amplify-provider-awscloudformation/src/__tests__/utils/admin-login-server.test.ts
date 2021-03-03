import { AdminLoginServer } from '../../utils/admin-login-server';
import { $TSContext } from 'amplify-cli-core';
import { FunctionRuntimeLifecycleManager } from 'amplify-function-plugin-interface';

const runtimePlugin_stub = ({
  checkDependencies: jest.fn().mockResolvedValue({ hasRequiredDependencies: true }),
  build: jest.fn().mockResolvedValue({ rebuilt: true }),
} as unknown) as jest.Mocked<FunctionRuntimeLifecycleManager>;

const context_stub = ({
  amplify: {
    readBreadcrumbs: jest.fn().mockReturnValue({ pluginId: 'testPluginId' }),
    loadRuntimePlugin: jest.fn().mockResolvedValue(runtimePlugin_stub),
    updateamplifyMetaAfterBuild: jest.fn(),
  },
} as unknown) as jest.Mocked<$TSContext>;

const useMock = jest.fn();
const postMock = jest.fn(async () => {});
const listenMock = jest.fn();

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
  test('run server with 127.0.0.1', async () => {
    const adminLoginServer = new AdminLoginServer('appId', 'http://example.com', context_stub.print);

    await new Promise<void>(resolve => {
      adminLoginServer.startServer(() => {});
      resolve();
    });
    expect(useMock).toBeCalled();
    expect(postMock).toBeCalled();
    expect(listenMock).toBeCalledWith(4242, '127.0.0.1');
  });
});
