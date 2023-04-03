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
const uuid_1 = require("uuid");
const migration_helpers_1 = require("../../migration-helpers");
describe('amplify function migration', () => {
    let projRoot;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        projRoot = yield (0, amplify_e2e_core_1.createNewProjectDir)('functions');
        const migrateFromVersion = { v: 'unintialized' };
        const migrateToVersion = { v: 'unintialized' };
        yield (0, migration_helpers_1.versionCheck)(process.cwd(), false, migrateFromVersion);
        yield (0, migration_helpers_1.versionCheck)(process.cwd(), true, migrateToVersion);
        expect(migrateFromVersion.v).not.toEqual(migrateToVersion.v);
        expect(migration_helpers_1.allowedVersionsToMigrateFrom).toContain(migrateFromVersion.v);
        yield (0, migration_helpers_1.initJSProjectWithProfileV4_52_0)(projRoot, { name: 'functionmigration' });
    }));
    afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, amplify_e2e_core_1.deleteProject)(projRoot, null, true);
        (0, amplify_e2e_core_1.deleteProjectDir)(projRoot);
    }));
    it('existing lambda updated with additional permissions should be able to scan ddb', () => __awaiter(void 0, void 0, void 0, function* () {
        const { projectName: appName } = (0, amplify_e2e_core_1.getProjectConfig)(projRoot);
        const fnName = `integtestfn${(0, amplify_e2e_core_1.generateRandomShortId)()}`;
        yield (0, amplify_e2e_core_1.addFunction)(projRoot, {
            name: fnName,
            functionTemplate: 'Hello World',
        }, 'nodejs');
        const functionCode = (0, amplify_e2e_core_1.loadFunctionTestFile)('dynamodb-scan.js');
        (0, amplify_e2e_core_1.overrideFunctionSrcNode)(projRoot, fnName, functionCode);
        yield (0, amplify_e2e_core_1.amplifyPushAuthV5V6)(projRoot);
        let meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
        const { Arn: functionArn, Name: functionName, Region: region } = Object.keys(meta.function).map((key) => meta.function[key])[0].output;
        expect(functionArn).toBeDefined();
        expect(functionName).toBeDefined();
        expect(region).toBeDefined();
        yield (0, amplify_e2e_core_1.addApiWithoutSchema)(projRoot, { testingWithLatestCodebase: true, transformerVersion: 1 });
        yield (0, amplify_e2e_core_1.updateApiSchema)(projRoot, appName, 'simple_model.graphql');
        yield (0, amplify_e2e_core_1.updateFunction)(projRoot, {
            name: fnName,
            additionalPermissions: {
                permissions: ['storage'],
                choices: ['function', 'api', 'storage'],
                resources: ['Todo:@model(appsync)'],
                resourceChoices: ['Todo:@model(appsync)'],
                operations: ['read'],
            },
            testingWithLatestCodebase: true,
        }, 'nodejs');
        yield (0, amplify_e2e_core_1.amplifyPush)(projRoot, true);
        meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
        const { GraphQLAPIIdOutput: appsyncId } = Object.keys(meta.api).map((key) => meta.api[key])[0].output;
        const result = yield (0, amplify_e2e_core_1.invokeFunction)(functionName, JSON.stringify({ tableName: `Todo-${appsyncId}-integtest` }), region);
        expect(result.StatusCode).toBe(200);
        expect(result.Payload).toBeDefined();
        const payload = JSON.parse(result.Payload.toString());
        expect(payload.errorType).toBeUndefined();
        expect(payload.errorMessage).toBeUndefined();
        expect(payload.Items).toBeDefined();
        expect(payload.Count).toBeDefined();
        expect(payload.ScannedCount).toBeDefined();
    }));
    it('Add 2 functions, upgrade cli, add layer, update a function to depend on layer', () => __awaiter(void 0, void 0, void 0, function* () {
        const [shortId] = (0, uuid_1.v4)().split('-');
        const function1 = `function1${shortId}`;
        const function2 = `function2${shortId}`;
        const runtime = 'nodejs';
        const { projectName: projName } = (0, amplify_e2e_core_1.getProjectConfig)(projRoot);
        yield (0, amplify_e2e_core_1.addFunction)(projRoot, { name: function1, functionTemplate: 'Hello World' }, runtime, undefined);
        yield (0, amplify_e2e_core_1.addFunction)(projRoot, { name: function2, functionTemplate: 'Hello World' }, runtime, undefined);
        yield (0, amplify_e2e_core_1.amplifyPushAuthV5V6)(projRoot);
        const layerName = `test${shortId}`;
        const layerSettings = {
            layerName,
            projName,
            runtimes: [runtime],
        };
        yield (0, amplify_e2e_core_1.addLayer)(projRoot, layerSettings, true);
        yield (0, amplify_e2e_core_1.updateFunction)(projRoot, {
            layerOptions: {
                select: [projName + layerName],
                expectedListOptions: [projName + layerName],
                layerAndFunctionExist: true,
            },
            name: function1,
            testingWithLatestCodebase: true,
        }, runtime);
        yield (0, amplify_e2e_core_1.amplifyPushLayer)(projRoot, {}, true);
        const arns = [(0, amplify_e2e_core_1.getCurrentLayerArnFromMeta)(projRoot, { layerName, projName })];
        const meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
        yield (0, amplify_e2e_core_1.validateLayerMetadata)(projRoot, { layerName, projName }, meta, 'integtest', arns);
    }));
});
//# sourceMappingURL=function_migration_update.test.js.map