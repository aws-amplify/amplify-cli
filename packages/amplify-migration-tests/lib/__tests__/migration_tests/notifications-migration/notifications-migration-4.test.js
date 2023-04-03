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
const notifications_helpers_1 = require("../../../migration-helpers/notifications-helpers");
const utils_1 = require("../../../migration-helpers/utils");
describe('amplify add notifications', () => {
    let projectRoot;
    const migrateFromVersion = { v: '10.0.0' };
    const migrateToVersion = { v: 'uninitialized' };
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        projectRoot = yield (0, amplify_e2e_core_1.createNewProjectDir)('notification-migration-4');
        yield (0, migration_helpers_1.versionCheck)(process.cwd(), false, migrateFromVersion);
        yield (0, migration_helpers_1.versionCheck)(process.cwd(), true, migrateToVersion);
    }));
    afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, amplify_e2e_core_1.deleteProject)(projectRoot, undefined, true);
        (0, amplify_e2e_core_1.deleteProjectDir)(projectRoot);
    }));
    it('should pull app if notifications added and removed with an older version', () => __awaiter(void 0, void 0, void 0, function* () {
        expect(migrateFromVersion.v).not.toEqual(migrateToVersion.v);
        const settings = { resourceName: `notification${(0, utils_1.getShortId)()}` };
        yield (0, migration_helpers_1.initJSProjectWithProfileV4_52_0)(projectRoot, { disableAmplifyAppCreation: false }, false);
        const appId = (0, amplify_e2e_core_1.getAppId)(projectRoot);
        expect(appId).toBeDefined();
        yield (0, notifications_helpers_1.addLegacySmsNotificationChannel)(projectRoot, settings.resourceName);
        yield (0, amplify_e2e_core_1.amplifyPushAuthV5V6)(projectRoot);
        yield (0, notifications_helpers_1.removeLegacyAllNotificationChannel)(projectRoot);
        const projectRootPull = yield (0, amplify_e2e_core_1.createNewProjectDir)('removed-notifications-pull');
        try {
            yield (0, amplify_e2e_core_1.amplifyPull)(projectRootPull, { override: false, emptyDir: true, appId }, true);
        }
        finally {
            (0, amplify_e2e_core_1.deleteProjectDir)(projectRootPull);
        }
    }));
});
//# sourceMappingURL=notifications-migration-4.test.js.map