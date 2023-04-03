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
const init_1 = require("../../migration-helpers-v10/init");
const utils_1 = require("../../migration-helpers/utils");
describe('geo category migration from v10 to latest', () => {
    const projectName = 'geoMigration';
    let projRoot;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, migration_helpers_1.validateVersionsForMigrationTest)();
    }));
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        projRoot = yield (0, amplify_e2e_core_1.createNewProjectDir)(projectName);
        yield (0, init_1.initJSProjectWithProfileV10)(projRoot, { name: 'geoMigration', disableAmplifyAppCreation: false });
        yield (0, amplify_e2e_core_1.addAuthWithDefault)(projRoot);
        yield (0, amplify_e2e_core_1.addMapWithDefault)(projRoot);
        yield (0, amplify_e2e_core_1.addPlaceIndexWithDefault)(projRoot);
        const cognitoGroups = ['admin', 'admin1'];
        yield (0, amplify_e2e_core_1.updateAuthAddUserGroups)(projRoot, cognitoGroups);
        yield (0, amplify_e2e_core_1.addGeofenceCollectionWithDefault)(projRoot, cognitoGroups);
        yield (0, amplify_e2e_core_1.amplifyPushWithoutCodegen)(projRoot);
    }));
    afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, amplify_e2e_core_1.deleteProject)(projRoot, null, true);
        (0, amplify_e2e_core_1.deleteProjectDir)(projRoot);
    }));
    it('...pull and push should not drift with new amplify version', () => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, utils_1.pullPushWithLatestCodebaseValidateParameterAndCfnDrift)(projRoot, projectName);
    }));
});
//# sourceMappingURL=geo.migration.test.js.map