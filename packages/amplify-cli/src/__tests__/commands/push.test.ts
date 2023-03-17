import { $TSContext } from 'amplify-cli-core';
import * as pushCommandModule from '../../commands/push';

describe('amplify push:', () => {
  const mockContext = {
    amplify: {
      pushResources: jest.fn(),
      constructExeInfo: jest.fn().mockReturnValue({
        inputParams: {
          yes: true,
        },
      }),
    },
    exeInfo: {
      localEnvInfo: {
        noUpdateBackend: false,
      },
    },
    parameters: {
      options: {
        force: false,
      },
      command: 'push',
    },
  };

  it('push run method should exist', () => {
    expect(pushCommandModule.run).toBeDefined();
  });

  it('push run should sync current backend', async () => {
    const syncCurrentCloudBackendSpy = jest.spyOn(pushCommandModule, 'syncCurrentCloudBackend') as jest.SpyInstance;
    syncCurrentCloudBackendSpy.mockImplementation(() => Promise.resolve());

    const updateTrackedFilesSpy = jest.spyOn(pushCommandModule, 'updateTrackedFiles') as jest.SpyInstance;
    updateTrackedFilesSpy.mockImplementation(() => Promise.resolve());

    await pushCommandModule.run(mockContext as unknown as $TSContext);
    expect(syncCurrentCloudBackendSpy).toHaveBeenCalled();
  });

  it('push --force run should NOT sync current backend', async () => {
    const syncCurrentCloudBackendSpy = jest.spyOn(pushCommandModule, 'syncCurrentCloudBackend') as jest.SpyInstance;
    syncCurrentCloudBackendSpy.mockImplementation(() => Promise.resolve());

    const updateTrackedFilesSpy = jest.spyOn(pushCommandModule, 'updateTrackedFiles') as jest.SpyInstance;
    updateTrackedFilesSpy.mockImplementation(() => Promise.resolve());

    mockContext.parameters.options.force = true;
    await pushCommandModule.run(mockContext as unknown as $TSContext);
    expect(syncCurrentCloudBackendSpy).not.toHaveBeenCalled();
  });
});
