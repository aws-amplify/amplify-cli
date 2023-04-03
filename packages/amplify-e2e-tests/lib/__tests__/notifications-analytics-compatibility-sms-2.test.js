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
var import_helpers_1 = require("../import-helpers");
describe('notification category compatibility test', function () {
    var testChannelSelection = 'SMS';
    var envName = 'test';
    var projectPrefix = "notificationCompatibility".substring(0, 19);
    var projectSettings = {
        name: projectPrefix,
        disableAmplifyAppCreation: false,
        envName: envName,
    };
    var projectRoot;
    var pullTestProjectRoot;
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
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.removeAnalytics)(projectRoot)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.deleteProject)(projectRoot)];
                case 2:
                    _a.sent();
                    (0, amplify_e2e_core_1.deleteProjectDir)(projectRoot);
                    if (pullTestProjectRoot) {
                        (0, amplify_e2e_core_1.deleteProjectDir)(pullTestProjectRoot);
                    }
                    return [2 /*return*/];
            }
        });
    }); });
    it("should work with pre-existing pinpoint that has pushed", function () { return __awaiter(void 0, void 0, void 0, function () {
        var pinpointResourceName, appId, settings, meta, SMSMeta, analyticsMeta, teamInfo, pinpointId, updatedMeta, updatedInAppMsgMeta, cloudBackendMeta, cloudBackendInAppMsgMeta, finalLocalMeta, endCloudBackendMeta;
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
                    // BEGIN - SETUP PINPOINT (see analytics.test.ts)
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addPinpointAnalytics)(projectRoot, false, pinpointResourceName)];
                case 2:
                    // BEGIN - SETUP PINPOINT (see analytics.test.ts)
                    _l.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushUpdate)(projectRoot)];
                case 3:
                    _l.sent();
                    settings = { resourceName: pinpointResourceName };
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addNotificationChannel)(projectRoot, settings, testChannelSelection, true, true)];
                case 4:
                    _l.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.sleep)(3000)];
                case 5:
                    _l.sent();
                    meta = (0, amplify_e2e_core_1.getBackendAmplifyMeta)(projectRoot);
                    SMSMeta = (_b = (_a = meta.notifications[pinpointResourceName]) === null || _a === void 0 ? void 0 : _a.output) === null || _b === void 0 ? void 0 : _b.SMS;
                    analyticsMeta = (_c = meta.analytics[pinpointResourceName]) === null || _c === void 0 ? void 0 : _c.output;
                    expect(SMSMeta).toBeDefined();
                    expect(analyticsMeta).toBeDefined();
                    expect(SMSMeta.Enabled).toBe(true);
                    expect(SMSMeta.ApplicationId).toEqual(analyticsMeta.Id);
                    teamInfo = (0, amplify_e2e_core_1.getTeamProviderInfo)(projectRoot);
                    pinpointId = (_f = (_e = (_d = teamInfo[envName].categories) === null || _d === void 0 ? void 0 : _d.analytics) === null || _e === void 0 ? void 0 : _e.Pinpoint) === null || _f === void 0 ? void 0 : _f.Id;
                    expect(pinpointId).toBeDefined();
                    expect(pinpointId).toEqual(analyticsMeta.Id);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)("notification-pull".concat((0, import_helpers_1.getShortId)()))];
                case 6:
                    // Test that backend resources match local configurations
                    pullTestProjectRoot = _l.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPull)(pullTestProjectRoot, { override: false, emptyDir: true, appId: appId })];
                case 7:
                    _l.sent();
                    (0, import_helpers_1.expectLocalAndPulledBackendConfigMatching)(projectRoot, pullTestProjectRoot);
                    (0, import_helpers_1.expectLocalAndPulledBackendAmplifyMetaMatching)(projectRoot, pullTestProjectRoot);
                    (0, import_helpers_1.expectLocalAndPulledAwsExportsMatching)(projectRoot, pullTestProjectRoot);
                    // remove SMS channel only, this will update both local and cloud
                    return [4 /*yield*/, (0, amplify_e2e_core_1.removeNotificationChannel)(projectRoot, testChannelSelection)];
                case 8:
                    // remove SMS channel only, this will update both local and cloud
                    _l.sent();
                    updatedMeta = (0, amplify_e2e_core_1.getBackendAmplifyMeta)(projectRoot);
                    updatedInAppMsgMeta = (_h = (_g = updatedMeta.notifications[pinpointResourceName]) === null || _g === void 0 ? void 0 : _g.output) === null || _h === void 0 ? void 0 : _h.SMS;
                    expect(updatedInAppMsgMeta).toBeDefined();
                    expect(updatedInAppMsgMeta.Enabled).toBe(false);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getProjectMeta)(projectRoot)];
                case 9:
                    cloudBackendMeta = _l.sent();
                    cloudBackendInAppMsgMeta = (_k = (_j = cloudBackendMeta.notifications[pinpointResourceName]) === null || _j === void 0 ? void 0 : _j.output) === null || _k === void 0 ? void 0 : _k.SMS;
                    expect(cloudBackendInAppMsgMeta).toBeDefined();
                    expect(cloudBackendInAppMsgMeta.Enabled).toBe(false);
                    // make sure Notifications/Analytics/Auth still show up in status
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyStatus)(projectRoot, 'Notifications')];
                case 10:
                    // make sure Notifications/Analytics/Auth still show up in status
                    _l.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyStatus)(projectRoot, 'Analytics')];
                case 11:
                    _l.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyStatus)(projectRoot, 'Auth')];
                case 12:
                    _l.sent();
                    // this will remove notifications inline, so both local/cloud will be updated
                    return [4 /*yield*/, (0, amplify_e2e_core_1.removeAllNotificationChannel)(projectRoot)];
                case 13:
                    // this will remove notifications inline, so both local/cloud will be updated
                    _l.sent();
                    // analytics/auth should still exist
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyStatus)(projectRoot, 'Analytics')];
                case 14:
                    // analytics/auth should still exist
                    _l.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyStatus)(projectRoot, 'Auth')];
                case 15:
                    _l.sent();
                    finalLocalMeta = (0, amplify_e2e_core_1.getBackendAmplifyMeta)(projectRoot);
                    expect(finalLocalMeta.notifications).toBeUndefined();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getProjectMeta)(projectRoot)];
                case 16:
                    endCloudBackendMeta = _l.sent();
                    expect(endCloudBackendMeta.notifications).toBeUndefined();
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=notifications-analytics-compatibility-sms-2.test.js.map