import { stateManager, exitOnNextTick, ResourceDoesNotExistError } from '@aws-amplify/amplify-cli-core';
import { printer, prompter } from '@aws-amplify/amplify-prompts';
import * as path from 'path';
import { removeResourceParameters } from '../../../extensions/amplify-helpers/envResourceParams';
import { removeResource, forceRemoveResource } from '../../../extensions/amplify-helpers/remove-resource';
import { updateBackendConfigAfterResourceRemove } from '../../../extensions/amplify-helpers/update-backend-config';

jest.mock('../../../extensions/amplify-helpers/envResourceParams');
jest.mock('../../../extensions/amplify-helpers/update-backend-config');

jest.mock('inquirer', () => ({
  prompt: jest.fn().mockResolvedValue({ resource: 'lambda1' }),
}));

jest.mock('@aws-amplify/amplify-cli-core', () => ({
  ...(jest.requireActual('@aws-amplify/amplify-cli-core') as {}),
  stateManager: {
    getCurrentMeta: jest.fn(),
    getMeta: jest.fn(),
    getTeamProviderInfo: jest.fn(),
    setMeta: jest.fn(),
    setTeamProviderInfo: jest.fn(),
  },
  pathManager: {
    getResourceDirectoryPath: jest.fn((_, categoryName, resourceName) => path.join('backendDirPath', categoryName, resourceName)),
    getStackBuildCategoryResourceDirPath: jest.fn((_, categoryName, resourceName) =>
      path.join('backendDirPath/awscloudformation/build/', categoryName, resourceName),
    ),
  },
  exitOnNextTick: jest.fn().mockImplementation(() => {
    throw 'process.exit mock';
  }),
}));

const stateManagerMock = stateManager as jest.Mocked<typeof stateManager>;

jest.mock('@aws-amplify/amplify-prompts');
const prompterMock = prompter as jest.Mocked<typeof prompter>;

describe('remove-resource', () => {
  let context;

  beforeEach(() => {
    context = {
      input: {
        options: {},
      },
      filesystem: {
        remove: jest.fn(),
      },
      usageData: {
        emitError: jest.fn(),
      },
      amplify: {
        confirmPrompt: jest.fn(() => true),
        getResourceStatus: jest.fn().mockReturnValue({
          allResources: [
            {
              providerPlugin: 'awscloudformation',
              service: 'Cognito',
              resourceName: 'authResourceName',
            },
            {
              build: true,
              providerPlugin: 'awscloudformation',
              service: 'Lambda',
              dependsOn: [
                {
                  category: 'function',
                  resourceName: 'lambdaLayer1',
                },
              ],
              resourceName: 'lambda1',
            },
            {
              build: true,
              providerPlugin: 'awscloudformation',
              service: 'LambdaLayer',
              resourceName: 'lambdaLayer1',
            },
          ],
        }),
      },
    };
    stateManagerMock.getMeta.mockReturnValue({
      auth: {
        authResourceName: {
          service: 'Cognito',
          serviceType: 'imported',
          providerPlugin: 'awscloudformation',
        },
      },
      function: {
        lambda1: {
          service: 'Lambda',
          dependsOn: [
            {
              category: 'function',
              resourceName: 'lambdaLayer1',
            },
          ],
        },
        lambdaLayer1: {
          service: 'LambdaLayer',
        },
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('removeResource', () => {
    it('emit an error when the resource of the specified category does not exist', async () => {
      await expect(removeResource(context as any, 'api', 'test')).rejects.toThrowError('No resources added for this category');
    });

    it('emit an error when the resource of the specified resource name does not exist', async () => {
      await expect(removeResource(context as any, 'function', 'lambda2')).rejects.toThrowError(
        'Resource lambda2 has not been added to function',
      );
    });

    it('prompts resource name when not specified resource name', async () => {
      prompterMock.pick.mockResolvedValueOnce('lambda1');
      await expect(
        removeResource(context as any, 'function', undefined, {
          serviceDeletionInfo: {
            LambdaLayer: 'lambdaLayer deletion info message',
          },
          serviceSuffix: { Lambda: '(function)', LambdaLayer: '(layer)' },
        }),
      ).resolves.toEqual({
        service: 'Lambda',
        resourceName: 'lambda1',
      });

      expect(prompterMock.pick).toBeCalledWith('Choose the resource you would want to remove', [
        {
          name: 'lambda1 (function)',
          value: 'lambda1',
        },
        {
          name: 'lambdaLayer1 (layer)',
          value: 'lambdaLayer1',
        },
      ]);
    });

    it('print the deletion info when choose LambdaLayer', async () => {
      prompterMock.pick.mockResolvedValueOnce('lambdaLayer1');

      let error;
      try {
        await removeResource(context as any, 'function', undefined, {
          serviceDeletionInfo: {
            LambdaLayer: 'lambdaLayer deletion info message',
          },
          serviceSuffix: { Lambda: '(function)', LambdaLayer: '(layer)' },
        });
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
      expect(error.message).toBe('Resource cannot be removed because it has a dependency on another resource');
      expect(error.details).toBe('Dependency: Lambda - lambda1. Remove the dependency first.');

      expect(prompterMock.pick).toBeCalledWith('Choose the resource you would want to remove', [
        {
          name: 'lambda1 (function)',
          value: 'lambda1',
        },
        {
          name: 'lambdaLayer1 (layer)',
          value: 'lambdaLayer1',
        },
      ]);

      expect(printer.info).toBeCalledWith('lambdaLayer deletion info message');
    });

    it('remove resource when the resource of the specified resource name does exist', async () => {
      await expect(removeResource(context as any, 'function', 'lambda1')).resolves.toEqual({
        service: 'Lambda',
        resourceName: 'lambda1',
      });

      expect(stateManagerMock.setMeta).toBeCalledWith(undefined, {
        auth: {
          authResourceName: {
            service: 'Cognito',
            serviceType: 'imported',
            providerPlugin: 'awscloudformation',
          },
        },
        function: {
          lambdaLayer1: {
            service: 'LambdaLayer',
          },
        },
      });
      expect(context.filesystem.remove).toBeCalledWith(path.join('backendDirPath', 'function', 'lambda1'));
      expect(context.filesystem.remove).toBeCalledWith(path.join('backendDirPath/awscloudformation/build', 'function', 'lambda1'));
      expect(context.filesystem.remove).toBeCalledTimes(2);
      expect(removeResourceParameters).toBeCalledWith(context, 'function', 'lambda1');
      expect(updateBackendConfigAfterResourceRemove).toBeCalledWith('function', 'lambda1');
      expect(printer.success).toBeCalledWith('Successfully removed resource');
    });

    it('not remove resource when confirm prompt returns false', async () => {
      context.amplify.confirmPrompt.mockReturnValue(false);

      await expect(removeResource(context as any, 'function', 'lambda1')).resolves.toBeUndefined();

      expect(stateManagerMock.setMeta).toBeCalledTimes(0);
      expect(context.filesystem.remove).toBeCalledTimes(0);
      expect(removeResourceParameters).toBeCalledTimes(0);
      expect(updateBackendConfigAfterResourceRemove).toBeCalledTimes(0);
    });

    it('throw an error when the dependent resources has a specified resource', async () => {
      let error;
      try {
        await removeResource(context as any, 'function', 'lambdaLayer1');
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
      expect(error.message).toBe('Resource cannot be removed because it has a dependency on another resource');
      expect(error.details).toBe('Dependency: Lambda - lambda1. Remove the dependency first.');
    });

    it('print message to unlink the imported resource on confirm prompt when the specified service is imported resource', async () => {
      await expect(removeResource(context as any, 'auth', 'authResourceName')).resolves.toEqual({
        service: 'Cognito',
        resourceName: 'authResourceName',
      });

      expect(context.amplify.confirmPrompt).toBeCalledWith(
        'Are you sure you want to unlink this imported resource from this Amplify backend environment? The imported resource itself will not be deleted.',
      );
    });
  });

  describe('forceRemoveResource', () => {
    it('force remove the resource even when the dependent resources has a specified resource', async () => {
      await expect(
        forceRemoveResource(context as any, 'function', 'lambdaLayer1', 'backendDirPath/function/lambdaLayer1'),
      ).resolves.toEqual({
        service: 'LambdaLayer',
        resourceName: 'lambdaLayer1',
      });

      expect(stateManagerMock.setMeta).toBeCalledWith(undefined, {
        auth: {
          authResourceName: {
            service: 'Cognito',
            serviceType: 'imported',
            providerPlugin: 'awscloudformation',
          },
        },
        function: {
          lambda1: {
            service: 'Lambda',
            dependsOn: [
              {
                category: 'function',
                resourceName: 'lambdaLayer1',
              },
            ],
          },
        },
      });
      expect(context.filesystem.remove).toBeCalledWith('backendDirPath/function/lambdaLayer1');
      expect(context.filesystem.remove).toBeCalledWith('backendDirPath/awscloudformation/build/function/lambdaLayer1');
      expect(removeResourceParameters).toBeCalledWith(context, 'function', 'lambdaLayer1');
      expect(updateBackendConfigAfterResourceRemove).toBeCalledWith('function', 'lambdaLayer1');
      expect(printer.success).toBeCalledWith('Successfully removed resource');
    });

    it('emit an error when the resource of the specified category does not exist', async () => {
      await expect(
        forceRemoveResource(context as any, 'hosting', 'S3AndCloudFront', 'backendDirPath/hosting/S3AndCloudFront'),
      ).rejects.toBe('process.exit mock');

      expect(printer.error).toBeCalledWith('No resources added for this category');
      expect(context.usageData.emitError).toBeCalledWith(new ResourceDoesNotExistError('No resources added for this category'));
      expect(exitOnNextTick).toBeCalledWith(1);
    });

    it('returns undefined when error deleting files', async () => {
      context.filesystem.remove.mockImplementation(() => {
        throw new Error('mock remove file error');
      });
      await expect(
        forceRemoveResource(context as any, 'function', 'lambdaLayer1', 'backendDirPath/function/lambdaLayer1'),
      ).resolves.toBeUndefined();
      expect(printer.error).toBeCalledWith('Unable to force removal of resource: error deleting files');
    });
  });
});
