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
describe('amplify add/update storage(DDB)', () => {
    let projRoot;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        projRoot = yield (0, amplify_e2e_core_1.createNewProjectDir)('ddb-add-update migration');
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
    it('init a project and add/update ddb table with & without trigger', () => __awaiter(void 0, void 0, void 0, function* () {
        // init, add storage and push with local cli
        yield (0, migration_helpers_1.initJSProjectWithProfileV4_52_0)(projRoot, {});
        yield (0, amplify_e2e_core_1.addAuthWithDefault)(projRoot);
        yield (0, amplify_e2e_core_1.addSimpleDDB)(projRoot, {});
        yield (0, amplify_e2e_core_1.addDDBWithTrigger)(projRoot, {});
        yield (0, amplify_e2e_core_1.amplifyPushAuthV5V6)(projRoot);
        // update and push with codebase
        yield (0, amplify_e2e_core_1.updateDDBWithTriggerMigration)(projRoot, { testingWithLatestCodebase: true });
        yield (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot, true);
        const meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
        const { Name: table1Name, Arn: table1Arn, Region: table1Region, StreamArn: table1StreamArn, } = Object.keys(meta.storage).map((key) => meta.storage[key])[0].output;
        expect(table1Name).toBeDefined();
        expect(table1Arn).toBeDefined();
        expect(table1Region).toBeDefined();
        expect(table1StreamArn).toBeDefined();
        const table1Configs = yield (0, amplify_e2e_core_1.getDDBTable)(table1Name, table1Region);
        expect(table1Configs.Table.TableArn).toEqual(table1Arn);
        const { Name: table2Name, Arn: table2Arn, Region: table2Region, StreamArn: table2StreamArn, } = Object.keys(meta.storage).map((key) => meta.storage[key])[1].output;
        expect(table2Name).toBeDefined();
        expect(table2Arn).toBeDefined();
        expect(table2Region).toBeDefined();
        expect(table2StreamArn).toBeDefined();
        const table2Configs = yield (0, amplify_e2e_core_1.getDDBTable)(table2Name, table2Region);
        expect(table2Configs.Table.TableArn).toEqual(table2Arn);
    }));
});
function getPluginServiceMetaFromAmplifyMeta(amplifyMeta, pluginServiceName) {
    for (const resourceName of Object.keys(amplifyMeta.storage)) {
        if (amplifyMeta.storage[resourceName].service === pluginServiceName) {
            return amplifyMeta.storage[resourceName];
        }
    }
    throw new Error(`${pluginServiceName} Resource not found in meta-file`);
}
function getPluginDependsOnFromResourceMeta(resourceMeta, dependencyCategory) {
    for (const dependentResource of resourceMeta.dependsOn) {
        if (dependentResource.category === dependencyCategory) {
            return dependentResource;
        }
    }
    throw new Error(`${resourceMeta.providerMetadata.logicalId} has no dependsOn of ${dependencyCategory}`);
}
describe('amplify add/update storage(S3)', () => {
    let projRoot;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        projRoot = yield (0, amplify_e2e_core_1.createNewProjectDir)('s3-add-update migration');
    }));
    afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, amplify_e2e_core_1.deleteProject)(projRoot, undefined, true);
        (0, amplify_e2e_core_1.deleteProjectDir)(projRoot);
    }));
    it('init a project and add s3 bucket & update with new trigger', () => __awaiter(void 0, void 0, void 0, function* () {
        // init, add storage and push with local cli
        yield (0, migration_helpers_1.initJSProjectWithProfileV4_52_0)(projRoot, {});
        yield (0, amplify_e2e_core_1.addAuthWithDefault)(projRoot);
        yield (0, amplify_e2e_core_1.addS3StorageWithAuthOnly)(projRoot);
        yield (0, amplify_e2e_core_1.amplifyPushAuthV5V6)(projRoot);
        // update and push with new codebase
        yield (0, amplify_e2e_core_1.updateS3AddTriggerWithAuthOnlyReqMigration)(projRoot, { testingWithLatestCodebase: true });
        yield (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot, true /*latest codebase*/);
        const meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
        const s3Meta = getPluginServiceMetaFromAmplifyMeta(meta, 'S3');
        const output = s3Meta.output;
        expect(output.BucketName).toBeDefined();
        expect(output.Region).toBeDefined();
        const bucketExists = yield (0, amplify_e2e_core_1.checkIfBucketExists)(output.BucketName, output.Region);
        expect(bucketExists).toMatchObject({});
        const dependsOnFunctionMeta = getPluginDependsOnFromResourceMeta(s3Meta, 'function');
        expect(dependsOnFunctionMeta.resourceName).toBeDefined();
    }));
});
//# sourceMappingURL=storage_migration_update.test.js.map