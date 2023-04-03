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
const migration_helpers_1 = require("../../../migration-helpers");
describe('test lambda layer migration flow introduced in v5.0.0', () => {
    let projRoot;
    let versionToMigrateFrom;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        projRoot = yield (0, amplify_e2e_core_1.createNewProjectDir)('functions');
        const version = { v: 'unintialized' };
        yield (0, migration_helpers_1.versionCheck)(process.cwd(), false, version);
        versionToMigrateFrom = version.v;
        if (versionToMigrateFrom === '4.28.2') {
            yield (0, migration_helpers_1.initJSProjectWithProfileV4_28_2)(projRoot, {}, false);
        }
        else if (versionToMigrateFrom === '4.52.0') {
            yield (0, migration_helpers_1.initJSProjectWithProfileV4_52_0)(projRoot, {});
        }
        else {
            throw new Error(`layer-migration.test.ts was invoked with an unexpected installed Amplify CLI version: ${versionToMigrateFrom}`);
        }
    }));
    afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, amplify_e2e_core_1.deleteProject)(projRoot, undefined, true);
        (0, amplify_e2e_core_1.deleteProjectDir)(projRoot);
    }));
    it('migrate layer in No Change state with "amplify update function", then push a new vesion after migration', () => __awaiter(void 0, void 0, void 0, function* () {
        const accountId = process.env.LAYERS_AWS_ACCOUNT_ID;
        const orgId = process.env.LAYERS_AWS_ORG_ID;
        if (!accountId || !orgId) {
            throw new Error('One or both env vars are not set: LAYERS_AWS_ACCOUNT_ID, LAYERS_AWS_ORG_ID');
        }
        const { projectName: projName } = (0, amplify_e2e_core_1.getProjectConfig)(projRoot);
        const [shortId] = (0, uuid_1.v4)().split('-');
        const layerName = `test${shortId}`;
        const layerRuntime = 'nodejs';
        const layerSettings = {
            layerName,
            permissions: ['Specific AWS accounts', 'Specific AWS organization'],
            accountId,
            orgId,
            projName,
            runtimes: [layerRuntime],
        };
        yield (0, migration_helpers_1.legacyAddLayer)(projRoot, layerSettings);
        yield (0, amplify_e2e_core_1.amplifyPushAuthV5V6)(projRoot);
        yield (0, amplify_e2e_core_1.amplifyStatus)(projRoot, 'No Change', true);
        yield (0, amplify_e2e_core_1.updateLayer)(projRoot, Object.assign(Object.assign({}, layerSettings), { dontChangePermissions: true, migrateLegacyLayer: true }), true);
        yield (0, amplify_e2e_core_1.amplifyStatus)(projRoot, 'Update', true);
        expect((0, migration_helpers_1.validateLayerConfigFilesMigrated)(projRoot, layerName)).toBe(true);
        yield (0, amplify_e2e_core_1.amplifyPushLayer)(projRoot, {}, true);
        yield (0, amplify_e2e_core_1.removeLayerVersion)(projRoot, { removeLegacyOnly: true }, [1], [1, 2], true);
        (0, migration_helpers_1.legacyAddOptData)(projRoot, layerName);
        yield (0, amplify_e2e_core_1.amplifyPushLayer)(projRoot, {}, true);
        yield (0, amplify_e2e_core_1.amplifyStatus)(projRoot, 'No Change', true);
    }));
    it('migrate layer in Create state with "amplify push"', () => __awaiter(void 0, void 0, void 0, function* () {
        const { projectName: projName } = (0, amplify_e2e_core_1.getProjectConfig)(projRoot);
        const [shortId] = (0, uuid_1.v4)().split('-');
        const layerName = `test${shortId}`;
        const layerRuntime = 'nodejs';
        const layerSettings = {
            layerName,
            projName,
            runtimes: [layerRuntime],
        };
        yield (0, migration_helpers_1.legacyAddLayer)(projRoot, layerSettings);
        yield (0, amplify_e2e_core_1.amplifyPushLayer)(projRoot, { migrateLegacyLayer: true }, true);
        expect((0, migration_helpers_1.validateLayerConfigFilesMigrated)(projRoot, layerName)).toBe(true);
    }));
    it('migrate layer in Update state with "amplify push"', () => __awaiter(void 0, void 0, void 0, function* () {
        const [shortId] = (0, uuid_1.v4)().split('-');
        const layerName = `test${shortId}`;
        const layerRuntime = 'nodejs';
        const layerSettings = {
            layerName,
            runtimes: [layerRuntime],
        };
        yield (0, migration_helpers_1.legacyAddLayer)(projRoot, layerSettings);
        yield (0, amplify_e2e_core_1.amplifyPushAuthV5V6)(projRoot);
        (0, migration_helpers_1.legacyAddOptData)(projRoot, layerName);
        yield (0, amplify_e2e_core_1.amplifyPushLayer)(projRoot, { migrateLegacyLayer: true }, true);
        yield (0, amplify_e2e_core_1.removeLayerVersion)(projRoot, { removeLegacyOnly: true }, [1], [1, 2], true);
        expect((0, migration_helpers_1.validateLayerConfigFilesMigrated)(projRoot, layerName)).toBe(true);
    }));
    it('migrate layer in No Change state with "amplify update function" by updating permissions', () => __awaiter(void 0, void 0, void 0, function* () {
        const [shortId] = (0, uuid_1.v4)().split('-');
        const layerName = `test${shortId}`;
        const layerRuntime = 'nodejs';
        const layerSettings = {
            layerName,
            runtimes: [layerRuntime],
        };
        yield (0, migration_helpers_1.legacyAddLayer)(projRoot, layerSettings);
        yield (0, amplify_e2e_core_1.amplifyPushAuthV5V6)(projRoot);
        yield (0, amplify_e2e_core_1.updateLayer)(projRoot, Object.assign(Object.assign({}, layerSettings), { projName: '', changePermissionOnLatestVersion: true, migrateLegacyLayer: true, permissions: ['Public (Anyone on AWS can use this layer)'] }), true);
        yield (0, amplify_e2e_core_1.amplifyPushLayer)(projRoot, {}, true);
        yield (0, amplify_e2e_core_1.removeLayerVersion)(projRoot, { removeLegacyOnly: true }, [1], [1, 2], true);
        expect((0, migration_helpers_1.validateLayerConfigFilesMigrated)(projRoot, layerName)).toBe(true);
    }));
    it('migrates a layer with no runtime', () => __awaiter(void 0, void 0, void 0, function* () {
        const [shortId] = (0, uuid_1.v4)().split('-');
        const layerName = `test${shortId}`;
        const layerSettings = {
            layerName,
            runtimes: [],
        };
        yield (0, migration_helpers_1.legacyAddLayer)(projRoot, layerSettings);
        (0, migration_helpers_1.legacyAddOptData)(projRoot, layerName);
        yield (0, amplify_e2e_core_1.amplifyPushAuthV5V6)(projRoot);
        yield (0, amplify_e2e_core_1.updateLayer)(projRoot, Object.assign(Object.assign({}, layerSettings), { dontChangePermissions: true, migrateLegacyLayer: true }), true);
        yield (0, amplify_e2e_core_1.amplifyPushLayer)(projRoot, {}, true);
        (0, migration_helpers_1.legacyUpdateOptData)(projRoot, layerName, 'update');
        yield (0, amplify_e2e_core_1.amplifyPushLayer)(projRoot, {}, true);
        expect((0, migration_helpers_1.validateLayerConfigFilesMigrated)(projRoot, layerName)).toBe(true);
    }));
    it('handle add and update function when legacy layer is present', () => __awaiter(void 0, void 0, void 0, function* () {
        const [shortId] = (0, uuid_1.v4)().split('-');
        const layerName = `test${shortId}`;
        const layerRuntime = 'nodejs';
        const functionSettings = {
            testingWithLatestCodebase: true,
            layerOptions: {
                select: [],
                expectedListOptions: [layerName],
                layerAndFunctionExist: true,
            },
        };
        yield (0, migration_helpers_1.legacyAddLayer)(projRoot, { layerName: layerName, runtimes: [layerRuntime] });
        yield (0, amplify_e2e_core_1.addFunction)(projRoot, Object.assign(Object.assign({}, functionSettings), { functionTemplate: 'Hello World' }), layerRuntime);
        yield (0, amplify_e2e_core_1.updateFunction)(projRoot, functionSettings, layerRuntime);
    }));
});
//# sourceMappingURL=layer-migration.test.js.map