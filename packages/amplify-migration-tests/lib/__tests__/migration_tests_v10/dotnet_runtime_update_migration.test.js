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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
const migration_helpers_1 = require("../../migration-helpers");
const init_1 = require("../../migration-helpers-v10/init");
const amplify_cli_core_1 = require("amplify-cli-core");
/**
 * These tests check that functions created with .NET Core 3.1 templates keep working after we drop support to create them.
 */
describe('existing dotnet core functions compatibility test', () => {
    let projRoot;
    let funcName;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        const migrateFromVersion = { v: 'unintialized' };
        const migrateToVersion = { v: 'unintialized' };
        yield (0, migration_helpers_1.versionCheck)(process.cwd(), false, migrateFromVersion);
        yield (0, migration_helpers_1.versionCheck)(process.cwd(), true, migrateToVersion);
        console.log(`Test migration from: ${migrateFromVersion} to ${migrateToVersion}`);
        // expect(migrateFromVersion.v).not.toEqual(migrateToVersion.v); // uncomment this once we are in v11 for local codebase
        expect(migration_helpers_1.allowedVersionsToMigrateFrom).toContain(migrateFromVersion.v);
    }));
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        projRoot = yield (0, amplify_e2e_core_1.createNewProjectDir)('netmigrationtest');
        funcName = `dotnettestfn${(0, amplify_e2e_core_1.generateRandomShortId)()}`;
        yield (0, init_1.initJSProjectWithProfileV10)(projRoot, { name: 'netmigrationtest' });
        yield (0, amplify_e2e_core_1.addFunction)(projRoot, {
            name: funcName,
            functionTemplate: 'Hello World',
        }, 'dotnetCore31');
    }));
    afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, amplify_e2e_core_1.deleteProject)(projRoot, null, true);
        (0, amplify_e2e_core_1.deleteProjectDir)(projRoot);
    }));
    const assertDotNetVersion = () => {
        const functionPath = amplify_cli_core_1.pathManager.getResourceDirectoryPath(projRoot, amplify_cli_core_1.AmplifyCategories.FUNCTION, funcName);
        const { functionRuntime } = amplify_cli_core_1.JSONUtilities.readJson(path_1.default.join(functionPath, 'amplify.state'));
        expect(functionRuntime).toEqual('dotnetcore3.1');
        const functionProjFilePath = path_1.default.join(functionPath, 'src', `${funcName}.csproj`);
        const functionProjFileContent = fs_extra_1.default.readFileSync(functionProjFilePath, 'utf8');
        expect(functionProjFileContent).toContain('<TargetFramework>netcoreapp3.1</TargetFramework>');
    };
    it('use dotnet hello world function and invoke in the cloud', () => __awaiter(void 0, void 0, void 0, function* () {
        const payload = '{"key1":"value1","key2":"value2","key3":"value3"}';
        yield (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot, true);
        const response = yield (0, amplify_e2e_core_1.functionCloudInvoke)(projRoot, { funcName, payload });
        expect(JSON.parse(response.Payload.toString())).toEqual({
            key1: 'VALUE1',
            key2: 'VALUE2',
            key3: 'VALUE3',
        });
        assertDotNetVersion();
    }));
    it('use dotnet hello world function and mock locally', () => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, amplify_e2e_core_1.functionMockAssert)(projRoot, {
            funcName,
            successString: '  "key3": "VALUE3"',
            eventFile: 'src/event.json',
        }, true); // will throw if successString is not in output
        assertDotNetVersion();
    }));
});
//# sourceMappingURL=dotnet_runtime_update_migration.test.js.map