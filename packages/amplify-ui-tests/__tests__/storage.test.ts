import {
    initProjectWithProfile,
    deleteProject,
    amplifyPush
  } from '../src/init';
import { addStorageWithDefault } from '../src/categories/storage';
import { createNewProjectDir, deleteProjectDir, existsAWSExportsPath } from '../src/utils';
import { addAuthWithDefault } from '../src/categories/auth';

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

    it('add storage with default settings', async () => {
        await initProjectWithProfile(projRoot, {});
        await addAuthWithDefault(projRoot, {}); // should add auth before add storage
        await addStorageWithDefault(projRoot, {});
        await amplifyPush(projRoot);

        expect(existsAWSExportsPath(projRoot)).toBeTruthy()
    })
})