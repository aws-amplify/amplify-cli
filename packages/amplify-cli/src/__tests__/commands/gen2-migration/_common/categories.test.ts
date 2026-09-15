import { extractCategory } from '../../../../commands/gen2-migration/_common/categories';

describe('extractCategory', () => {
  it.each([
    ['storageauthbackup', 'Storage'],
    ['apiStorageResolver', 'Api'],
    ['functionAuthHandler', 'Function'],
    ['analyticsAuthStream', 'Analytics'],
  ])('classifies %s using the category prefix', (logicalId, expectedCategory) => {
    expect(extractCategory(logicalId)).toBe(expectedCategory);
  });
});
