import { stateManager } from '@aws-amplify/amplify-cli-core';
import { getEnvInfo } from '../../../extensions/amplify-helpers/get-env-info';

jest.mock('@aws-amplify/amplify-cli-core', () => ({
  stateManager: {
    getLocalEnvInfo: jest.fn(),
    localEnvInfoExists: jest.fn(),
  },
}));

const stateManagerMock = stateManager as jest.Mocked<typeof stateManager>;

beforeAll(() => {
  stateManagerMock.getLocalEnvInfo.mockReturnValue({ test: true });
});

test('Return env file info', () => {
  stateManagerMock.localEnvInfoExists.mockReturnValue(true);
  expect(getEnvInfo()).toHaveProperty('test', true);
});

test('Throw EnvironmentNotInitializedError', () => {
  stateManagerMock.localEnvInfoExists.mockReturnValue(false);
  expect(() => {
    getEnvInfo();
  }).toThrow();
});
