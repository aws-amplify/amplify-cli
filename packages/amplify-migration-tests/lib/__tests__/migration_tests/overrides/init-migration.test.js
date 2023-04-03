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
const path = __importStar(require("path"));
const amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
const amplify_cli_core_1 = require("amplify-cli-core");
const migration_helpers_1 = require("../../../migration-helpers");
describe('amplify init', () => {
    let projRoot;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        projRoot = yield (0, amplify_e2e_core_1.createNewProjectDir)('init');
        const migrateFromVersion = { v: 'unintialized' };
        const migrateToVersion = { v: 'unintialized' };
        yield (0, migration_helpers_1.versionCheck)(process.cwd(), false, migrateFromVersion);
        yield (0, migration_helpers_1.versionCheck)(process.cwd(), true, migrateToVersion);
        expect(migrateFromVersion.v).not.toEqual(migrateToVersion.v);
        expect(migration_helpers_1.allowedVersionsToMigrateFrom).toContain(migrateFromVersion.v);
    }));
    afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, amplify_e2e_core_1.deleteProject)(projRoot, undefined, true);
        (0, amplify_e2e_core_1.deleteProjectDir)(projRoot);
    }));
    it('should init the project and override root and push', () => __awaiter(void 0, void 0, void 0, function* () {
        const projectName = 'initMigrationTest';
        yield (0, migration_helpers_1.initJSProjectWithProfileV4_52_0)(projRoot, { name: projectName });
        const meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot).providers.awscloudformation;
        expect(meta.Region).toBeDefined();
        // turn ON feature flag
        const cliJsonPath = path.join(projRoot, 'amplify', 'cli.json');
        const cliJSON = amplify_cli_core_1.JSONUtilities.readJson(cliJsonPath);
        const modifiedCliJson = Object.assign(cliJSON, { overrides: { project: true } });
        amplify_cli_core_1.JSONUtilities.writeJson(cliJsonPath, modifiedCliJson);
        // override new env
        yield (0, amplify_e2e_core_1.amplifyOverrideRoot)(projRoot, { testingWithLatestCodebase: true });
        const srcOverrideFilePath = path.join(__dirname, '..', '..', '..', '..', '..', 'amplify-e2e-tests', 'overrides', 'override-root.ts');
        const destOverrideFilePath = path.join(projRoot, 'amplify', 'backend', 'awscloudformation', 'override.ts');
        (0, amplify_e2e_core_1.replaceOverrideFileWithProjectInfo)(srcOverrideFilePath, destOverrideFilePath, 'integtest', projectName);
        yield (0, amplify_e2e_core_1.amplifyPushOverride)(projRoot, true);
        const newEnvMeta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot).providers.awscloudformation;
        expect(newEnvMeta.AuthRoleName).toContain('mockRole');
    }));
});
//# sourceMappingURL=init-migration.test.js.map