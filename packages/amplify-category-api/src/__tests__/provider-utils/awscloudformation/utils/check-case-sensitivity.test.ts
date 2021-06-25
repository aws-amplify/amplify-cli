import { isNameUnique } from '../../../../provider-utils/awscloudformation/utils/check-case-sensitivity';
import { stateManager } from 'amplify-cli-core';

jest.mock('amplify-cli-core');

const stateManager_mock = stateManager as jest.Mocked<typeof stateManager>;

stateManager_mock.getMeta.mockReturnValue({
  api: {
    testBlog: {},
  },
});

test('conflict exists if names differ by case only', () => {
  expect(() => isNameUnique('api', 'testblog')).toThrowErrorMatchingInlineSnapshot(
    `"A resource named testBlog already exists. Amplify resource names must be unique and are case-insensitive."`,
  );
});

test('conflict does not exist if names differ by characters', () => {
  const result = isNameUnique('api', 'newname');
  expect(result).toBe(true);
});
