import { $TSContext } from '@aws-amplify/amplify-cli-core';
import execa from 'execa';
import { buildCustomResources } from '../../utils/build-custom-resources';

jest.mock('@aws-amplify/amplify-cli-core');
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

jest.mock('@aws-amplify/amplify-cli-core', () => ({
  getPackageManager: jest.fn().mockResolvedValue('npm'),
  pathManager: {
    getBackendDirPath: jest.fn().mockReturnValue('mockTargetDir'),
  },
  JSONUtilities: {
    writeJson: jest.fn(),
    readJson: jest.fn(),
    stringify: jest.fn(),
  },
  skipHooks: jest.fn().mockReturnValue(false),
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
});
