import { stateManager } from 'amplify-cli-core';
import { getEnvInfo } from '../../../extensions/amplify-helpers/get-env-info';

jest.mock('amplify-cli-core', () => ({
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

test('Throw EnvironmentNotInitializedError only one', () => {
  const spy = jest.spyOn(console, 'error').mockImplementation();
  stateManagerMock.localEnvInfoExists.mockReturnValue(false);
  try {
    getEnvInfo();
  } catch(error) {
    expect(error.message).toBe('Current environment cannot be determined.');
    expect(error.resolution).toBe("Use 'amplify init' in the root of your app directory to create a new environment.");
    expect(error.cause).toEqual(new Error('`amplify init` not done'));
  }
  expect(spy).toHaveBeenCalledTimes(1);
});
