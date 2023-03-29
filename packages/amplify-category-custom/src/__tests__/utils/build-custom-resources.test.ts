import { AmplifyError } from 'amplify-cli-core';
import execa from 'execa';
import * as fs from 'fs-extra';
import { buildCustomResources } from '../../utils/build-custom-resources';
import type { $TSContext } from 'amplify-cli-core';

jest.mock('amplify-cli-core');
jest.mock('@aws-amplify/amplify-prompts');
jest.mock('../../utils/dependency-management-utils');
jest.mock('../../utils/generate-cfn-from-cdk');
jest.mock('execa');
jest.mock('ora');

jest.mock('fs-extra', () => ({
  readFileSync: jest.fn().mockReturnValue('mockCode'),
  existsSync: jest.fn().mockReturnValue(true),
  ensureDirSync: jest.fn().mockReturnValue(true),
  ensureDir: jest.fn(),
  writeFileSync: jest.fn().mockReturnValue(true),
  writeFile: jest.fn(),
}));

jest.mock('ora', () => () => ({
  start: jest.fn(),
  fail: jest.fn(),
  succeed: jest.fn(),
  stop: jest.fn(),
}));

jest.mock('../../utils/dependency-management-utils', () => ({
  getAllResources: jest.fn().mockResolvedValue({ mockedvalue: 'mockedkey' }),
}));

jest.mock('../../utils/generate-cfn-from-cdk', () => ({
  generateCloudFormationFromCDK: jest.fn(),
}));

jest.mock('amplify-cli-core', () => ({
  AmplifyError: Error,
  getPackageManager: jest.fn().mockResolvedValue('npm'),
  pathManager: {
    getBackendDirPath: jest.fn().mockReturnValue('mockTargetDir'),
  },
  JSONUtilities: {
    writeJson: jest.fn(),
    readJson: jest.fn(),
    stringify: jest.fn(),
  },
}));

describe('build custom resources scenarios', () => {
  let mockContext: $TSContext;

  beforeEach(() => {
    jest.clearAllMocks();
    mockContext = {
      amplify: {
        openEditor: jest.fn(),
        updateamplifyMetaAfterResourceAdd: jest.fn(),
        copyBatch: jest.fn(),
        getResourceStatus: jest.fn().mockResolvedValue({
          allResources: [
            {
              resourceName: 'mockresource1',
              service: 'customCDK',
            },
            {
              resourceName: 'mockresource2',
              service: 'customCDK',
            },
          ],
        }),
      },
    } as unknown as $TSContext;
  });

  it('build all resources', async () => {
    await buildCustomResources(mockContext);

    // 2 for npm install and 2 for tsc build (1 per resource)
    expect(execa.sync).toBeCalledTimes(4);
  });

  it('should error if resource directory does not exist', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    const error = new AmplifyError('MissingResourceDirectoryError', {
      message: 'Could not find the directory for the resource "mockresource1"',
    });
    const wrapped = new AmplifyError(
      'InvalidCustomResourceError',
      {
        details: error.message,
        message: `There was an error building the custom resources`,
        resolution: 'There may be errors in your custom resource file. If so, fix the errors and try again.',
      },
      error,
    );

    await expect(buildCustomResources(mockContext, 'mockresource1')).rejects.toStrictEqual(wrapped);
  });

  it('should error if tsc is not found', async () => {
    // First call to existsSync returns true, second call returns false
    jest.spyOn(fs, 'existsSync').mockReturnValueOnce(true).mockReturnValueOnce(false);
    const error = new AmplifyError('MissingOverridesInstallationRequirementsError', {
      message: 'TypeScript executable not found.',
      resolution: 'Please add it as a dev-dependency in the package.json file for this resource.',
    });
    const wrapped = new AmplifyError(
      'InvalidCustomResourceError',
      {
        details: error.message,
        message: `There was an error building the custom resources`,
        resolution: 'There may be errors in your custom resource file. If so, fix the errors and try again.',
      },
      error,
    );

    await expect(buildCustomResources(mockContext, 'mockresource1')).rejects.toStrictEqual(wrapped);
  });
});
