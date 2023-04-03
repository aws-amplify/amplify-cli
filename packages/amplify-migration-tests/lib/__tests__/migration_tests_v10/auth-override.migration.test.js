"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const init_1 = require("../../migration-helpers-v10/init");
const utils_1 = require("../../migration-helpers/utils");
const path = __importStar(require("path"));
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
    it('...should add auth with overrides and work fine on latest version', () => __awaiter(void 0, void 0, void 0, function* () {
        const projectName = 'authTest';
        yield (0, init_1.initJSProjectWithProfileV10)(projRoot1, { name: projectName, disableAmplifyAppCreation: false });
        yield (0, amplify_e2e_core_1.addAuthWithDefault)(projRoot1);
        yield (0, amplify_e2e_core_1.amplifyPushWithoutCodegen)(projRoot1);
        const meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot1);
        const authResourceName = Object.keys(meta.auth).filter((key) => meta.auth[key].service === 'Cognito');
        const userPoolId = Object.keys(meta.auth).map((key) => meta.auth[key])[0].output.UserPoolId;
        // override new env
        yield (0, amplify_e2e_core_1.amplifyOverrideAuth)(projRoot1);
        // this is where we will write our override logic to
        const destOverrideFilePath = path.join(projRoot1, 'amplify', 'backend', 'auth', `${authResourceName}`, 'override.ts');
        const srcOverrideFilePath = path.join(__dirname, '..', '..', '..', 'overrides', 'override-auth.ts');
        (0, amplify_e2e_core_1.replaceOverrideFileWithProjectInfo)(srcOverrideFilePath, destOverrideFilePath, 'integtest', projectName);
        yield (0, amplify_e2e_core_1.amplifyPushOverride)(projRoot1);
        const appId = (0, amplify_e2e_core_1.getAppId)(projRoot1);
        expect(appId).toBeDefined();
        const projRoot2 = yield (0, amplify_e2e_core_1.createNewProjectDir)('authMigration2');
        try {
            yield (0, amplify_e2e_core_1.amplifyPull)(projRoot2, { emptyDir: true, appId }, true);
            (0, utils_1.assertNoParameterChangesBetweenProjects)(projRoot1, projRoot2);
            expect((0, utils_1.collectCloudformationDiffBetweenProjects)(projRoot1, projRoot2)).toMatchSnapshot();
            yield (0, amplify_e2e_core_1.amplifyPushWithoutCodegen)(projRoot2, true);
            (0, utils_1.assertNoParameterChangesBetweenProjects)(projRoot1, projRoot2);
            expect((0, utils_1.collectCloudformationDiffBetweenProjects)(projRoot1, projRoot2)).toMatchSnapshot();
            // check overwritten config
            const overwrittenUserPool = yield (0, amplify_e2e_core_1.getUserPool)(userPoolId, meta.providers.awscloudformation.Region);
            expect(overwrittenUserPool.UserPool).toBeDefined();
            expect(overwrittenUserPool.UserPool.DeviceConfiguration.ChallengeRequiredOnNewDevice).toBe(true);
        }
        finally {
            (0, amplify_e2e_core_1.deleteProjectDir)(projRoot2);
        }
    }));
});
//# sourceMappingURL=auth-override.migration.test.js.map