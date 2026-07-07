import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { run as pushCommand } from '../../commands/push';
import * as updateTrackedFilesModule from '../../extensions/amplify-helpers/update-tracked-files';
import * as currentCloudBackendUtilsModule from '../../extensions/amplify-helpers/current-cloud-backend-utils';

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

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('push run method should exist', () => {
    expect(pushCommand).toBeDefined();
  });

  it('push run should sync current backend', async () => {
    const syncCurrentCloudBackendSpy = jest.spyOn(currentCloudBackendUtilsModule, 'syncCurrentCloudBackend') as jest.SpyInstance;
    syncCurrentCloudBackendSpy.mockImplementation(() => Promise.resolve());

    const updateCognitoTrackedFilesSpy = jest.spyOn(updateTrackedFilesModule, 'updateCognitoTrackedFiles') as jest.SpyInstance;
    updateCognitoTrackedFilesSpy.mockImplementation(() => Promise.resolve());

    await pushCommand(mockContext as unknown as $TSContext);
    expect(syncCurrentCloudBackendSpy).toHaveBeenCalled();
  });

  it('push --force run should NOT sync current backend', async () => {
    const syncCurrentCloudBackendSpy = jest.spyOn(currentCloudBackendUtilsModule, 'syncCurrentCloudBackend') as jest.SpyInstance;
    syncCurrentCloudBackendSpy.mockImplementation(() => Promise.resolve());

    const updateCognitoTrackedFilesSpy = jest.spyOn(updateTrackedFilesModule, 'updateCognitoTrackedFiles') as jest.SpyInstance;
    updateCognitoTrackedFilesSpy.mockImplementation(() => Promise.resolve());

    mockContext.parameters.options.force = true;
    await pushCommand(mockContext as unknown as $TSContext);
    expect(syncCurrentCloudBackendSpy).not.toHaveBeenCalled();
  });
});
