"use strict";
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
const cfn_diff_exclusions_1 = require("../../migration-helpers-v10/cfn-diff-exclusions");
const init_1 = require("../../migration-helpers-v10/init");
const utils_1 = require("../../migration-helpers/utils");
describe('api serverless migration tests', () => {
    let projRoot;
    let projectName;
    afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, amplify_e2e_core_1.deleteProject)(projRoot, undefined, true);
        (0, amplify_e2e_core_1.deleteProjectDir)(projRoot);
    }));
    it('...adds serverless REST api with v10 and pulls without drift in latest version', () => __awaiter(void 0, void 0, void 0, function* () {
        projectName = 'restDDB';
        projRoot = yield (0, amplify_e2e_core_1.createNewProjectDir)(projectName);
        yield (0, init_1.initJSProjectWithProfileV10)(projRoot, { name: 'restApiTest', disableAmplifyAppCreation: false });
        yield (0, amplify_e2e_core_1.addRestApi)(projRoot, { isCrud: false });
        yield (0, amplify_e2e_core_1.amplifyPushUpdateLegacy)(projRoot);
        const meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
        (0, amplify_e2e_core_1.validateRestApiMeta)(projRoot, meta);
        // pull down with vlatest
        const appId = (0, amplify_e2e_core_1.getAppId)(projRoot);
        expect(appId).toBeDefined();
        const projRoot2 = yield (0, amplify_e2e_core_1.createNewProjectDir)(`${projectName}2`);
        try {
            yield (0, amplify_e2e_core_1.amplifyPull)(projRoot2, { emptyDir: true, appId }, true);
            (0, utils_1.assertNoParameterChangesBetweenProjects)(projRoot, projRoot2);
            expect((0, utils_1.collectCloudformationDiffBetweenProjects)(projRoot, projRoot2, cfn_diff_exclusions_1.cfnDiffExclusions)).toMatchSnapshot();
            yield (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot2, true);
            (0, utils_1.assertNoParameterChangesBetweenProjects)(projRoot, projRoot2);
            expect((0, utils_1.collectCloudformationDiffBetweenProjects)(projRoot, projRoot2, cfn_diff_exclusions_1.cfnDiffExclusions)).toMatchSnapshot();
            // validate metadata
            const meta2 = (0, amplify_e2e_core_1.getProjectMeta)(projRoot2);
            (0, amplify_e2e_core_1.validateRestApiMeta)(projRoot2, meta2);
        }
        finally {
            (0, amplify_e2e_core_1.deleteProjectDir)(projRoot2);
        }
    }));
});
//# sourceMappingURL=api-rest-serverless.migration.test.js.map