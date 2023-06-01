import { prompter } from '@aws-amplify/amplify-prompts';
import { mockAllCategories } from '../mockAll';
import { start as apiServerStart } from '../api';
import { start as storageServerStart } from '../storage';
import { start as lambdaServerStart } from '../func';
import { $TSAny } from '@aws-amplify/amplify-cli-core';

jest.mock('../api');
jest.mock('../storage');
jest.mock('../func');
jest.mock('@aws-amplify/amplify-prompts');
jest.mock('@aws-amplify/amplify-cli-core', () => ({
  ...jest.requireActual('@aws-amplify/amplify-cli-core'),
  FeatureFlags: {
    getNumber: jest.fn(),
  },
}));

const prompterMock = prompter as jest.Mocked<typeof prompter>;
prompterMock.pick.mockResolvedValueOnce(['GraphQL API', 'Function', 'Storage']);
const apiServerStartMock = apiServerStart as jest.MockedFunction<typeof apiServerStart>;
const storageServerStartMock = storageServerStart as jest.MockedFunction<typeof storageServerStart>;
const lambdaServerStartMock = lambdaServerStart as jest.MockedFunction<typeof lambdaServerStart>;
const mockProjectRoot = 'mock-app';

jest.mock('amplify-dynamodb-simulator', () => jest.fn());
const mockContext = {
  amplify: {
    inputValidation: () => () => true,
    readJsonFile: jest.fn(),
    getResourceStatus: () => ({
      allResources: [{ service: 'AppSync' }, { service: 'Lambda' }, { service: 'S3' }],
      resourcesToBeUpdated: [{}],
      resourcesToBeCreated: [{}],
    }),
    getEnvInfo: jest.fn().mockReturnValue({ projectPath: mockProjectRoot }),
  },
};

describe('mock all tests', () => {
  it('should pass', async () => {
    await mockAllCategories(mockContext as $TSAny);
    expect(apiServerStartMock).toBeCalledTimes(1);
    expect(storageServerStartMock).toBeCalledTimes(1);
    expect(lambdaServerStartMock).toBeCalledTimes(1);
  });
});
