import { stateManager, toolkitExtensions } from '../..';
const { getProjectMeta } = toolkitExtensions;

const stateManagerMock = stateManager as jest.Mocked<typeof stateManager>;
jest.spyOn(stateManager, 'metaFileExists').mockImplementation(() => true);
jest.spyOn(stateManager, 'getMeta').mockImplementation(() => ({
  auth: {
    amplifyAuth: 'test',
  },
}));

describe('getProjectMeta', () => {
  it('should get the project-meta when metaFile exists', () => {
    stateManagerMock.metaFileExists.mockImplementation(() => true);
    const projectMeta = getProjectMeta();
    expect(projectMeta).toEqual({
      auth: {
        amplifyAuth: 'test',
      },
    });
  });
  it('should throw ProjectNotInitializedError when metaFile does not exists', () => {
    stateManagerMock.metaFileExists.mockImplementation(() => false);
    expect(() => getProjectMeta()).toThrow(`No Amplify backend project files detected within this folder.`);
  });
});
