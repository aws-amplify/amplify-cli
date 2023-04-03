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
const migration_helpers_1 = require("../../../migration-helpers");
describe('amplify key force push', () => {
    let projRoot;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        projRoot = yield (0, amplify_e2e_core_1.createNewProjectDir)('api-key-cli-migration');
        const migrateFromVersion = { v: 'unintialized' };
        const migrateToVersion = { v: 'unintialized' };
        yield (0, migration_helpers_1.versionCheck)(process.cwd(), false, migrateFromVersion);
        yield (0, migration_helpers_1.versionCheck)(process.cwd(), true, migrateToVersion);
        expect(migrateFromVersion.v).not.toEqual(migrateToVersion.v);
        expect(migration_helpers_1.allowedVersionsToMigrateFrom).toContain(migrateFromVersion.v);
        yield (0, migration_helpers_1.initJSProjectWithProfileV4_52_0)(projRoot, { name: 'gqlkeymigration' });
    }));
    afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, amplify_e2e_core_1.deleteProject)(projRoot, null, true);
        (0, amplify_e2e_core_1.deleteProjectDir)(projRoot);
    }));
    it('init project, add key and migrate with force push', () => __awaiter(void 0, void 0, void 0, function* () {
        const initialSchema = 'migrations_key/simple_key.graphql';
        const { projectName } = (0, amplify_e2e_core_1.getProjectConfig)(projRoot);
        // add api and push with installed cli
        yield (0, migration_helpers_1.addApiWithoutSchemaOldDx)(projRoot);
        (0, amplify_e2e_core_1.updateApiSchema)(projRoot, projectName, initialSchema);
        yield (0, amplify_e2e_core_1.amplifyPushLegacy)(projRoot);
        // gql-compile and force push with codebase cli
        yield (0, amplify_e2e_core_1.apiGqlCompile)(projRoot, true);
        yield (0, amplify_e2e_core_1.amplifyPushForce)(projRoot, true);
    }));
});
//# sourceMappingURL=api.key.migration.test.js.map