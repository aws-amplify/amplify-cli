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
describe('API Gateway CDK migration', () => {
    let projRoot;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        const [shortId] = (0, uuid_1.v4)().split('-');
        const projName = `apigwmig${shortId}`;
        projRoot = yield (0, amplify_e2e_core_1.createNewProjectDir)(projName);
        yield (0, migration_helpers_1.initJSProjectWithProfileV4_52_0)(projRoot, { name: projName });
    }));
    afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, amplify_e2e_core_1.deleteProject)(projRoot, undefined, true);
        (0, amplify_e2e_core_1.deleteProjectDir)(projRoot);
    }));
    it('migrates auth with admin queries', () => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, amplify_e2e_core_1.addAuthWithDefault)(projRoot);
        yield (0, amplify_e2e_core_1.updateAuthAddAdminQueries)(projRoot);
        yield (0, amplify_e2e_core_1.amplifyPushAuthV5V6)(projRoot);
        yield (0, amplify_e2e_core_1.updateAuthAdminQueriesWithExtMigration)(projRoot, { testingWithLatestCodebase: true });
        yield (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot, true);
        const meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
        const authName = Object.keys(meta.auth)[0];
        const authCliInputs = (0, amplify_e2e_core_1.getCLIInputs)(projRoot, 'auth', authName);
        expect(authCliInputs).toBeDefined();
        const adminQueriesCliInputs = (0, amplify_e2e_core_1.getCLIInputs)(projRoot, 'api', 'AdminQueries');
        expect(adminQueriesCliInputs).toBeDefined();
    }));
});
//# sourceMappingURL=apigw-ext-migration-2.test.js.map