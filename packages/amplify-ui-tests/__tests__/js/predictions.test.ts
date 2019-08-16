import { getUITestConfig, createNewProjectDir, deleteProjectDir, createTestMetaFile } from "../../src/utils";
import { gitCloneSampleApp, setupCypress, signUpNewUser, closeServer, buildApp, startServer, runCypressTest } from "../../src/utils/command";
import { deleteProject, initProjectWithProfile, amplifyPush } from "../../src/init";
import { addAuthWithDefault } from "../../src/categories/auth";
import { addIdentityText, addConvertWithDefault } from "../../src/categories/predictions";
import { existsAWSExportsPath, copyAWSExportsToProj } from "../../src/utils/projectMeta";
import { join } from "path";

describe('Prediction tests in JavaScript SDK:', () => {
    let projRoot: string;
    let destRoot: string;
    const { Predictions, gitRepo } = getUITestConfig();
    const PREDICT_PORT_NUMBER: string = Predictions.port;
    const JS_SAMPLE_APP_REPO: string =
      process.env.AMPLIFY_JS_SAMPLES_STAGING_URL ? process.env.AMPLIFY_JS_SAMPLES_STAGING_URL : gitRepo;

    describe('Simple predictions UI test:', async () => {
        const { apps } = Predictions.simplePredictions;
        let settings = {};

        beforeAll(async () => {
            projRoot = createNewProjectDir();
            jest.setTimeout(1000 * 60 * 60); // 1 hour
            await gitCloneSampleApp(projRoot, {repo: JS_SAMPLE_APP_REPO});
            destRoot = projRoot + '/amplify-js-samples-staging';
            await setupCypress(destRoot);
        });

        afterAll(async () => {
            await deleteProject(projRoot, true, true);
            deleteProjectDir(projRoot);
        });

        it('should set up amplify backend and generate aws-export.js file', async () => {
            await initProjectWithProfile(projRoot, {}, true);
            await addAuthWithDefault(projRoot, {}, true); // should add auth before add predictions
            await addIdentityText(projRoot, {}, true);
            await addConvertWithDefault(projRoot, {}, true);
            await amplifyPush(projRoot, true);
            expect(existsAWSExportsPath(projRoot, 'js')).toBeTruthy()
        });

        it('should have user pool in backend and sign up a user for test', async () => {
          settings = await signUpNewUser(projRoot);
        });

        describe('Run UI tests on JS app', async () => {
            let appPort = PREDICT_PORT_NUMBER;
            afterEach(async () => {
              closeServer({port: appPort});
            });

            for (let i = 0; i < apps.length; i++) {
              it(`should pass all UI tests on app <${apps[i].name}>`, async () => {
                const appRoot = join(destRoot, apps[i].path);
                appPort = apps[i].port ? apps[i].port : PREDICT_PORT_NUMBER;
                copyAWSExportsToProj(projRoot, appRoot);
                await createTestMetaFile(destRoot, {...settings, port: appPort, name: apps[i].name, testFiles: apps[i].testFiles});
                await buildApp(appRoot);
                await startServer(appRoot, {port: appPort});
                await runCypressTest(destRoot).then(isPassed => expect(isPassed).toBeTruthy());
              });
            }
          });
    });
});
