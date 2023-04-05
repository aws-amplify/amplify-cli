import { $TSAny } from 'amplify-cli-core';
import { mockAllCategories } from '../../mockAll';
import { prompter } from '@aws-amplify/amplify-prompts';

jest.mock('@aws-amplify/amplify-prompts');

jest.mock('../../api', () => {
  return {
    start: jest.fn(),
  };
});

jest.mock('../../func', () => {
  return {
    start: jest.fn(),
  };
});

const prompter_mock = prompter as jest.Mocked<typeof prompter>;

jest.mock('@aws-amplify/amplify-util-mock', () => {
  return jest.fn();
});

jest.mock('amplify-cli-core', () => ({
  ...(jest.requireActual('amplify-cli-core') as {}),
  pathManager: {
    getAmplifyPackageLibDirPath: jest.fn().mockReturnValue('../../mockAll'),
    getAmplifyLibRoot: jest.fn().mockReturnValue(''),
    getAWSCredentialsFilePath: jest.fn().mockReturnValue(''),
    getAWSConfigFilePath: jest.fn().mockReturnValue(''),
  },
  FeatureFlags: {
    getNumber: jest.fn(),
  },
}));

describe('mock all', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call mockall prompter', async () => {
    const context_stub: $TSAny = {
      amplify: {
        inputValidation: () => () => true,
        readJsonFile: jest.fn(),
        getResourceStatus: () => ({
          allResources: [{ service: 'AppSync' }, { service: 'Lambda' }, { service: 'S3' }],
          resourcesToBeUpdated: [{}],
          resourcesToBeCreated: [{}],
        }),
        getEnvInfo: () => ({ envName: 'testing' }),
      },
    };

    prompter_mock.pick.mockResolvedValueOnce(['AppSync']).mockResolvedValueOnce(['Lambda']).mockResolvedValueOnce(['S3']);
    await mockAllCategories(context_stub);
    expect(prompter_mock.pick).toBeCalled();
  });
});
