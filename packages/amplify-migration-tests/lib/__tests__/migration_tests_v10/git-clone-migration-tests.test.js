"use strict";
/**
 * Tests for headless init/pull workflows on git-cloned projects
 * These tests exercise workflows that hosting executes during backend builds
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
const init_1 = require("../../migration-helpers-v10/init");
describe('attach amplify to git-cloned project', () => {
    const envName = 'test';
    let projRoot;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        projRoot = yield (0, amplify_e2e_core_1.createNewProjectDir)('clone-test');
        yield (0, init_1.initJSProjectWithProfileV10)(projRoot, { envName, disableAmplifyAppCreation: false });
        yield (0, amplify_e2e_core_1.addAuthUserPoolOnly)(projRoot);
        yield (0, amplify_e2e_core_1.amplifyPushAuthV5V6)(projRoot);
        yield (0, amplify_e2e_core_1.gitInit)(projRoot);
        yield (0, amplify_e2e_core_1.gitCommitAll)(projRoot);
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, amplify_e2e_core_1.deleteProject)(projRoot, undefined, true);
        (0, amplify_e2e_core_1.deleteProjectDir)(projRoot);
    }));
    test('headless init and forcePush when triggers are added', () => __awaiter(void 0, void 0, void 0, function* () {
        // checks amplify hosting forcePush on existing projects with v10.5.1
        const { projectName } = (0, amplify_e2e_core_1.getProjectConfig)(projRoot);
        assertLambdaexecutionRoleArns(projRoot, false);
        yield (0, amplify_e2e_core_1.gitCleanFdx)(projRoot);
        const socialProviders = (0, amplify_e2e_core_1.getSocialProviders)();
        const categoriesConfig = {
            auth: {
                facebookAppIdUserPool: socialProviders.FACEBOOK_APP_ID,
                facebookAppSecretUserPool: socialProviders.FACEBOOK_APP_SECRET,
                googleAppIdUserPool: socialProviders.GOOGLE_APP_ID,
                googleAppSecretUserPool: socialProviders.GOOGLE_APP_SECRET,
                // eslint-disable-next-line spellcheck/spell-checker
                loginwithamazonAppIdUserPool: socialProviders.AMAZON_APP_ID,
                // eslint-disable-next-line spellcheck/spell-checker
                loginwithamazonAppSecretUserPool: socialProviders.AMAZON_APP_SECRET,
            },
        };
        yield (0, amplify_e2e_core_1.nonInteractiveInitWithForcePushAttach)(projRoot, (0, amplify_e2e_core_1.getAmplifyInitConfig)(projectName, envName), categoriesConfig, true);
        assertLambdaexecutionRoleArns(projRoot, true);
    }));
});
const assertLambdaexecutionRoleArns = (projRoot, isDefined) => {
    const meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
    const authKey = Object.keys(meta.auth).find((key) => meta.auth[key].service === 'Cognito');
    const createFunctionResourceName = `${authKey}CreateAuthChallenge`;
    const defineFunctionResourceName = `${authKey}DefineAuthChallenge`;
    const customMessageFunctionResourceName = `${authKey}CustomMessage`;
    const createFunctionMeta = meta.function[createFunctionResourceName];
    const defineFunctionMeta = meta.function[defineFunctionResourceName];
    const customMessageFunctionMeta = meta.function[customMessageFunctionResourceName];
    const createFunctionRoleArn = createFunctionMeta.output.LambdaExecutionRoleArn;
    const defineFunctionRoleArn = defineFunctionMeta.output.LambdaExecutionRoleArn;
    const customMessageFunctionRoleArn = customMessageFunctionMeta.output.LambdaExecutionRoleArn;
    if (isDefined) {
        expect(createFunctionRoleArn).toBeDefined();
        expect(defineFunctionRoleArn).toBeDefined();
        expect(customMessageFunctionRoleArn).toBeDefined();
    }
    else {
        expect(createFunctionRoleArn).not.toBeDefined();
        expect(defineFunctionRoleArn).not.toBeDefined();
        expect(customMessageFunctionRoleArn).not.toBeDefined();
    }
};
//# sourceMappingURL=git-clone-migration-tests.test.js.map