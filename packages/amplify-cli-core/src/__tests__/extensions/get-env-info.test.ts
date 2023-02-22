import { stateManager, getEnvInfo } from 'amplify-cli-core';

jest.spyOn(stateManager, 'getLocalEnvInfo');
jest.spyOn(stateManager, 'localEnvInfoExists');

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
