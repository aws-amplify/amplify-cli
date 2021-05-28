import { getProjectMeta } from '../../../extensions/amplify-helpers/get-project-meta';
import { stateManager } from 'amplify-cli-core';
jest.mock('amplify-cli-core', () => ({
  stateManager: {
    metaFileExists: jest.fn(),
    getMeta: jest.fn().mockImplementation(() => ({
      auth: {
        amplifyAuth: 'test',
      },
    })),
  },
}));

const stateManager_mock = stateManager as jest.Mocked<typeof stateManager>;

describe('getProjectMeta', () => {
  it('should get the project-meta when metaFile exists', () => {
    stateManager_mock.metaFileExists.mockImplementation(() => true);
    const projectMeta = getProjectMeta();
    expect(projectMeta).toEqual({
      auth: {
        amplifyAuth: 'test',
      },
    });
  });
  it('should throw NotInitializedError when metaFile does not exists', () => {
    stateManager_mock.metaFileExists.mockImplementation(() => false);
    expect(() => getProjectMeta()).toThrow();
  });
});
