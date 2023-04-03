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
const migration_helpers_1 = require("../../migration-helpers");
const cfn_diff_exclusions_1 = require("../../migration-helpers-v10/cfn-diff-exclusions");
const init_1 = require("../../migration-helpers-v10/init");
const utils_1 = require("../../migration-helpers/utils");
describe('amplify migration test auth', () => {
    let projRoot1;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        const migrateFromVersion = { v: 'unintialized' };
        const migrateToVersion = { v: 'unintialized' };
        yield (0, migration_helpers_1.versionCheck)(process.cwd(), false, migrateFromVersion);
        yield (0, migration_helpers_1.versionCheck)(process.cwd(), true, migrateToVersion);
        console.log(`Test migration from: ${migrateFromVersion.v} to ${migrateToVersion.v}`);
        expect(migrateFromVersion.v).not.toEqual(migrateToVersion.v);
        expect(migration_helpers_1.allowedVersionsToMigrateFrom).toContain(migrateFromVersion.v);
    }));
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        projRoot1 = yield (0, amplify_e2e_core_1.createNewProjectDir)('authMigration1');
    }));
    afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
        // note - this deletes the original project using the latest codebase
        yield (0, amplify_e2e_core_1.deleteProject)(projRoot1, null, true);
        (0, amplify_e2e_core_1.deleteProjectDir)(projRoot1);
    }));
    it('...should add auth with max options and work on the latest version', () => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, init_1.initJSProjectWithProfileV10)(projRoot1, { name: 'authTest', disableAmplifyAppCreation: false });
        yield (0, amplify_e2e_core_1.addAuthWithMaxOptions)(projRoot1, {});
        yield (0, amplify_e2e_core_1.amplifyPushAuthV10)(projRoot1);
        const appId = (0, amplify_e2e_core_1.getAppId)(projRoot1);
        expect(appId).toBeDefined();
        const projRoot2 = yield (0, amplify_e2e_core_1.createNewProjectDir)('authMigration2');
        try {
            yield (0, amplify_e2e_core_1.amplifyPull)(projRoot2, { emptyDir: true, appId }, true);
            (0, utils_1.assertNoParameterChangesBetweenProjects)(projRoot1, projRoot2);
            expect((0, utils_1.collectCloudformationDiffBetweenProjects)(projRoot1, projRoot2, cfn_diff_exclusions_1.cfnDiffExclusions)).toMatchSnapshot();
            // The following checks can be re-enabled once we find a way to configure the social logic provider values
            // on a newly pulled down project. Currently, those parameters don't get pulled down.
            // await amplifyPushWithoutCodegen(projRoot2, true);
            // assertNoParameterChangesBetweenProjects(projRoot1, projRoot2);
            // expect(collectCloudformationDiffBetweenProjects(projRoot1, projRoot2, cfnDiffExclusions)).toMatchSnapshot();
            // // should be able to remove & add auth after pulling down an older project
            // await removeAuthWithDefault(projRoot2, true);
            // await addAuthWithDefault(projRoot2, {}, true);
            // await amplifyPushAuth(projRoot2, true);
        }
        finally {
            (0, amplify_e2e_core_1.deleteProjectDir)(projRoot2);
        }
    }));
});
//# sourceMappingURL=auth-add-all.migration.test.js.map