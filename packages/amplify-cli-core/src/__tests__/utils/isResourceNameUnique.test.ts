import { isResourceNameUnique } from '../../utils';
import { stateManager } from '../../state-manager';

jest.mock('../../state-manager');

const stateManager_mock = stateManager as jest.Mocked<typeof stateManager>;

stateManager_mock.getMeta.mockReturnValue({
  api: {
    testBlog: {},
  },
});

test('conflict exists if names differ by case only - throw error', () => {
  expect(() => isResourceNameUnique('api', 'testblog')).toThrowErrorMatchingInlineSnapshot(
    `"A resource named 'testBlog' already exists. Amplify resource names must be unique and are case-insensitive."`,
  );
});

test('conflict exists - exit without throwing error', () => {
  const result = isResourceNameUnique('api', 'testBlog', false);
  expect(result).toBe(false);
});

test('conflict does not exist if names differ by characters', () => {
  const result = isResourceNameUnique('api', 'newname');
  expect(result).toBe(true);
});

test('conflict does not exist if category not found', () => {
  const result = isResourceNameUnique('nosuchcategory', 'newname');
  expect(result).toBe(true);
});
