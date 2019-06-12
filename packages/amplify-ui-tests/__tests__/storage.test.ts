import {
    initProjectWithProfile,
    deleteProject,
    amplifyPushAuth
  } from '../src/init';
import { addStorageWithDefault } from '../src/categories/storage';
import { createNewProjectDir, deleteProjectDir, getProjectMeta, getUserPool, getUserPoolClients } from '../src/utils';

describe('amplify add storage', () => {
    let projRoot: string;
    beforeEach(() => {
        projRoot = createNewProjectDir();
        jest.setTimeout(1000 * 60 * 60); // 1 hour
    })

    afterEach(async () => {
        await deleteProject(projRoot);
        deleteProjectDir(projRoot);
    })
})