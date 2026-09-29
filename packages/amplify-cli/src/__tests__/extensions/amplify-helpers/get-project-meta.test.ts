import { stateManager } from '@aws-amplify/amplify-cli-core';
import { getProjectMeta } from '../../../extensions/amplify-helpers/get-project-meta';

jest.mock('@aws-amplify/amplify-cli-core', () => {
  const original = jest.requireActual('@aws-amplify/amplify-cli-core');
  return {
    ...original,
    stateManager: {
      metaFileExists: jest.fn(),
      getMeta: jest.fn().mockImplementation(() => ({
        auth: {
          amplifyAuth: 'test',
        },
      })),
    },
  };
});

const stateManagerMock = stateManager as jest.Mocked<typeof stateManager>;

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
