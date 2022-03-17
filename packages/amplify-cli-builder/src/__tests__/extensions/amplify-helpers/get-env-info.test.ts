import { getEnvInfo } from '../../../extensions/amplify-helpers/get-env-info';
import { stateManager } from 'amplify-cli-core';

jest.mock('amplify-cli-core', () => ({
  stateManager: {
    getLocalEnvInfo: jest.fn(),
    localEnvInfoExists: jest.fn(),
  },
}));

const stateManager_mock = stateManager as jest.Mocked<typeof stateManager>;

beforeAll(() => {
  stateManager_mock.getLocalEnvInfo.mockReturnValue({ test: true });
});

test('Return env file info', () => {
  stateManager_mock.localEnvInfoExists.mockReturnValue(true);
  expect(getEnvInfo()).toHaveProperty('test', true);
});

test('Throw UndeterminedEnvironmentError', () => {
  stateManager_mock.localEnvInfoExists.mockReturnValue(false);
  expect(() => {
    getEnvInfo();
  }).toThrow();
});
