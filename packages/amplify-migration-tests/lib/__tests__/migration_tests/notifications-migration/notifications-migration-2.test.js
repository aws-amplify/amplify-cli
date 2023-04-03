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
        projectRoot = yield (0, amplify_e2e_core_1.createNewProjectDir)('notification-migration-2');
        yield (0, migration_helpers_1.versionCheck)(process.cwd(), false, migrateFromVersion);
        yield (0, migration_helpers_1.versionCheck)(process.cwd(), true, migrateToVersion);
    }));
    afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, amplify_e2e_core_1.deleteProject)(projectRoot, undefined, true);
        (0, amplify_e2e_core_1.deleteProjectDir)(projectRoot);
    }));
    it('should add in app notifications if another notification channel added with an older version', () => __awaiter(void 0, void 0, void 0, function* () {
        expect(migrateFromVersion.v).not.toEqual(migrateToVersion.v);
        const settings = { resourceName: `notification${(0, utils_1.getShortId)()}` };
        yield (0, migration_helpers_1.initJSProjectWithProfileV4_52_0)(projectRoot, {}, false);
        yield (0, notifications_helpers_1.addLegacySmsNotificationChannel)(projectRoot, settings.resourceName);
        yield (0, amplify_e2e_core_1.addNotificationChannel)(projectRoot, settings, 'In-App Messaging', true, true, true);
        yield (0, amplify_e2e_core_1.amplifyPushAuth)(projectRoot, true);
    }));
    it('should add in app notifications if another notification channel added and pushed with an older version', () => __awaiter(void 0, void 0, void 0, function* () {
        expect(migrateFromVersion.v).not.toEqual(migrateToVersion.v);
        const settings = { resourceName: `notification${(0, utils_1.getShortId)()}` };
        yield (0, migration_helpers_1.initJSProjectWithProfileV4_52_0)(projectRoot, {}, false);
        yield (0, notifications_helpers_1.addLegacySmsNotificationChannel)(projectRoot, settings.resourceName);
        yield (0, amplify_e2e_core_1.amplifyPushAuthV5V6)(projectRoot);
        yield (0, amplify_e2e_core_1.addNotificationChannel)(projectRoot, settings, 'In-App Messaging', true, true, true);
        yield (0, amplify_e2e_core_1.amplifyPushAuth)(projectRoot, true);
    }));
});
//# sourceMappingURL=notifications-migration-2.test.js.map