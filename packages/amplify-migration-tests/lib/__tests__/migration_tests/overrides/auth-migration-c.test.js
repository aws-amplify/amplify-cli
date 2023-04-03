"use strict";
/* eslint-disable spellcheck/spell-checker */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable jest/no-standalone-expect */
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
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const migration_helpers_1 = require("../../../migration-helpers");
const defaultSettings = {
    name: 'authMigration',
};
describe('amplify auth migration c', () => {
    let projRoot;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        projRoot = yield (0, amplify_e2e_core_1.createNewProjectDir)('auth_migration');
        const migrateFromVersion = { v: 'unintialized' };
        const migrateToVersion = { v: 'unintialized' };
        yield (0, migration_helpers_1.versionCheck)(process.cwd(), false, migrateFromVersion);
        yield (0, migration_helpers_1.versionCheck)(process.cwd(), true, migrateToVersion);
        expect(migrateFromVersion.v).not.toEqual(migrateToVersion.v);
        expect(migration_helpers_1.allowedVersionsToMigrateFrom).toContain(migrateFromVersion.v);
    }));
    afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
        const metaFilePath = path.join(projRoot, 'amplify', '#current-cloud-backend', 'amplify-meta.json');
        if (fs.existsSync(metaFilePath)) {
            yield (0, amplify_e2e_core_1.deleteProject)(projRoot, undefined, true);
        }
        (0, amplify_e2e_core_1.deleteProjectDir)(projRoot);
    }));
    it('...should init an android project and add customAuth flag, and remove flag when custom auth triggers are removed upon update', () => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, migration_helpers_1.initAndroidProjectWithProfile)(projRoot, defaultSettings);
        yield (0, amplify_e2e_core_1.addAuthWithRecaptchaTrigger)(projRoot);
        yield (0, amplify_e2e_core_1.amplifyPushAuthV5V6)(projRoot);
        let meta = (0, amplify_e2e_core_1.getAwsAndroidConfig)(projRoot);
        expect(meta.Auth.Default.authenticationFlowType).toBeDefined();
        expect(meta.Auth.Default.authenticationFlowType).toEqual('CUSTOM_AUTH');
        const amplifyMeta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
        const authResourceName = Object.keys(amplifyMeta.auth).filter((resourceName) => amplifyMeta.auth[resourceName].service === 'Cognito')[0];
        // update and push with codebase
        const overridesObj = {
            resourceName: authResourceName,
            category: 'auth',
            service: 'cognito',
        };
        yield (0, amplify_e2e_core_1.updateAuthRemoveRecaptchaTrigger)(projRoot, { testingWithLatestCodebase: true, overrides: overridesObj });
        yield (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot, true);
        meta = (0, amplify_e2e_core_1.getAwsAndroidConfig)(projRoot);
        expect(meta.Auth.Default.authenticationFlowType).toBeDefined();
        expect(meta.Auth.Default.authenticationFlowType).toEqual('USER_SRP_AUTH');
    }));
});
//# sourceMappingURL=auth-migration-c.test.js.map