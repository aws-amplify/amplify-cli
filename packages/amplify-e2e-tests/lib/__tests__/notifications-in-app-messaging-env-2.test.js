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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
var env_1 = require("../environment/env");
var import_helpers_1 = require("../import-helpers");
describe('notifications in-app without existing pinpoint', function () {
    var testChannel = 'InAppMessaging';
    var testChannelSelection = 'In-App Messaging';
    var envName = 'inapptesta';
    var projectPrefix = "notification".concat(testChannel).substring(0, 19);
    var projectSettings = {
        name: projectPrefix,
        disableAmplifyAppCreation: false,
        envName: envName,
    };
    var projectRoot;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)(projectPrefix)];
                case 1:
                    projectRoot = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    afterEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.deleteProject)(projectRoot)];
                case 1:
                    _a.sent();
                    (0, amplify_e2e_core_1.deleteProjectDir)(projectRoot);
                    return [2 /*return*/];
            }
        });
    }); });
    it("should add and remove the ".concat(testChannel, " channel correctly with multiple environments (w/ analytics)"), function () { return __awaiter(void 0, void 0, void 0, function () {
        var pinpointResourceName, appId, settings, meta, inAppMessagingMeta, analyticsMeta, teamInfo, pinpointId, newEnvName, newEnvCloudBackendMeta, newEnvCloudBackendInAppMsgMeta, originalEnvCloudBackendMeta, originalEnvCloudBackendInAppMsgMeta;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        return __generator(this, function (_l) {
            switch (_l.label) {
                case 0:
                    pinpointResourceName = "".concat(projectPrefix).concat((0, import_helpers_1.getShortId)());
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projectRoot, projectSettings)];
                case 1:
                    _l.sent();
                    appId = (0, amplify_e2e_core_1.getAppId)(projectRoot);
                    expect(appId).toBeDefined();
                    // BEGIN - SETUP PINPOINT but don't push
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addPinpointAnalytics)(projectRoot, false, pinpointResourceName)];
                case 2:
                    // BEGIN - SETUP PINPOINT but don't push
                    _l.sent();
                    settings = { resourceName: pinpointResourceName };
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addNotificationChannel)(projectRoot, settings, testChannelSelection, true, true)];
                case 3:
                    _l.sent();
                    // push both
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projectRoot)];
                case 4:
                    // push both
                    _l.sent();
                    // expect that Notifications, Analytics, and Auth categories are shown
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyStatus)(projectRoot, 'Notifications')];
                case 5:
                    // expect that Notifications, Analytics, and Auth categories are shown
                    _l.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyStatus)(projectRoot, 'Analytics')];
                case 6:
                    _l.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyStatus)(projectRoot, 'Auth')];
                case 7:
                    _l.sent();
                    meta = (0, amplify_e2e_core_1.getBackendAmplifyMeta)(projectRoot);
                    inAppMessagingMeta = (_b = (_a = meta.notifications[pinpointResourceName]) === null || _a === void 0 ? void 0 : _a.output) === null || _b === void 0 ? void 0 : _b.InAppMessaging;
                    analyticsMeta = (_c = meta.analytics[pinpointResourceName]) === null || _c === void 0 ? void 0 : _c.output;
                    expect(inAppMessagingMeta).toBeDefined();
                    expect(analyticsMeta).toBeDefined();
                    expect(inAppMessagingMeta.Enabled).toBe(true);
                    expect(inAppMessagingMeta.ApplicationId).toEqual(analyticsMeta.Id);
                    teamInfo = (0, amplify_e2e_core_1.getTeamProviderInfo)(projectRoot);
                    pinpointId = (_f = (_e = (_d = teamInfo[envName].categories) === null || _d === void 0 ? void 0 : _d.notifications) === null || _e === void 0 ? void 0 : _e.Pinpoint) === null || _f === void 0 ? void 0 : _f.Id;
                    expect(pinpointId).toBeDefined();
                    expect(pinpointId).toEqual(analyticsMeta.Id);
                    newEnvName = 'inapptestb';
                    return [4 /*yield*/, (0, env_1.addEnvironment)(projectRoot, { envName: newEnvName })];
                case 8:
                    _l.sent();
                    // new environment should show that we still need to push resources for this environment
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyStatus)(projectRoot, 'Create')];
                case 9:
                    // new environment should show that we still need to push resources for this environment
                    _l.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyStatus)(projectRoot, 'Notifications')];
                case 10:
                    _l.sent();
                    // remove in-app messaging on this environment
                    return [4 /*yield*/, (0, amplify_e2e_core_1.removeNotificationChannel)(projectRoot, testChannelSelection)];
                case 11:
                    // remove in-app messaging on this environment
                    _l.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projectRoot)];
                case 12:
                    _l.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getProjectMeta)(projectRoot)];
                case 13:
                    newEnvCloudBackendMeta = _l.sent();
                    newEnvCloudBackendInAppMsgMeta = (_h = (_g = newEnvCloudBackendMeta.notifications[pinpointResourceName]) === null || _g === void 0 ? void 0 : _g.output) === null || _h === void 0 ? void 0 : _h.InAppMessaging;
                    expect(newEnvCloudBackendInAppMsgMeta).toBeDefined();
                    expect(newEnvCloudBackendInAppMsgMeta.Enabled).toBe(false);
                    // switch back to the first environment
                    return [4 /*yield*/, (0, env_1.checkoutEnvironment)(projectRoot, { envName: envName, restoreBackend: true })];
                case 14:
                    // switch back to the first environment
                    _l.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getProjectMeta)(projectRoot)];
                case 15:
                    originalEnvCloudBackendMeta = _l.sent();
                    originalEnvCloudBackendInAppMsgMeta = (_k = (_j = originalEnvCloudBackendMeta.notifications[pinpointResourceName]) === null || _j === void 0 ? void 0 : _j.output) === null || _k === void 0 ? void 0 : _k.InAppMessaging;
                    expect(originalEnvCloudBackendInAppMsgMeta).toBeDefined();
                    expect(originalEnvCloudBackendInAppMsgMeta.Enabled).toBe(true);
                    // resources should still exist on the first environment (this checks that status works after checkout)
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyStatus)(projectRoot, 'Analytics')];
                case 16:
                    // resources should still exist on the first environment (this checks that status works after checkout)
                    _l.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyStatus)(projectRoot, 'Auth')];
                case 17:
                    _l.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyStatus)(projectRoot, 'Notifications')];
                case 18:
                    _l.sent();
                    // delete the 2nd environment
                    return [4 /*yield*/, (0, env_1.removeEnvironment)(projectRoot, { envName: newEnvName })];
                case 19:
                    // delete the 2nd environment
                    _l.sent();
                    // resources should still exist on the first environment (this checks that env1 is not deleted when deleting env2)
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyStatus)(projectRoot, 'Analytics')];
                case 20:
                    // resources should still exist on the first environment (this checks that env1 is not deleted when deleting env2)
                    _l.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyStatus)(projectRoot, 'Auth')];
                case 21:
                    _l.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyStatus)(projectRoot, 'Notifications')];
                case 22:
                    _l.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=notifications-in-app-messaging-env-2.test.js.map