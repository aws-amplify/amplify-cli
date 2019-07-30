import { createNewProjectDir, deleteProjectDir, existsAWSExportsPath } from "../../src/utils";
import { deleteProject, amplifyPush } from "../../src/init";
import { initIosProject } from "../../src/init/initProjectHelper";
import { addAuthWithDefault, signUpNewUser } from "../../src/categories/auth";

describe('iOS SDK:', () => {
    let projRoot: string;
    const AUTH_PORT_NUMBER: string = '3001';

    describe('Simple Auth UI test:', async () => {
        beforeAll(() => {
            projRoot = createNewProjectDir();
            jest.setTimeout(1000 * 60 * 60); //1 hour
        });

        afterAll(async () => {
            await deleteProject(projRoot);
            deleteProjectDir(projRoot);
        });

        it('should set up amplify backend and generate awsconfiguration.json file', async () => {
            await initIosProject(projRoot, {});
            await addAuthWithDefault(projRoot, {});
            await amplifyPush(projRoot);
            expect(existsAWSExportsPath(projRoot, 'ios')).toBeTruthy();
        });

        it('should have user pool in backend and sign up a user for test', async () => {
            await signUpNewUser(projRoot);
        });
    })
});