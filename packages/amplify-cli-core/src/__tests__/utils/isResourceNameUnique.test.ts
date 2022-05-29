import { isResourceNameUnique } from '../../utils';
import { stateManager } from '../../state-manager';

jest.mock('../../state-manager');

const stateManager_mock = stateManager as jest.Mocked<typeof stateManager>;

stateManager_mock.getMeta.mockReturnValue({
  api: {
    testBlog: {},
  },
});

test('conflict exists if names differ by case only', () => {
  expect(() => isResourceNameUnique('api', 'testblog')).toThrowErrorMatchingInlineSnapshot(
    `"A resource named 'testBlog' already exists. Amplify resource names must be unique and are case-insensitive."`,
  );
});

test('conflict does not exist if names differ by characters', () => {
  const result = isResourceNameUnique('api', 'newname');
  expect(result).toBe(true);
});
