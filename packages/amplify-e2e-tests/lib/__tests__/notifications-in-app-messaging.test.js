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
describe('notification category test - InAppMessaging', function () {
    var testChannel = 'InAppMessaging';
    var testChannelSelection = 'In-App Messaging';
    var envName = 'test';
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
    it("should add and remove the ".concat(testChannel, " channel correctly when no pinpoint is configured"), function () { return __awaiter(void 0, void 0, void 0, function () {
        var settings, appId, meta, inAppMessagingMeta, analyticsMeta, teamInfo, pinpointId, updatedMeta, updatedInAppMsgMeta, cloudBackendMeta, cloudBackendInAppMsgMeta, updatedCloudBackendMeta, updatedCloudBackendInAppMsgMeta, finalLocalMeta, endCloudBackendMeta;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        return __generator(this, function (_o) {
            switch (_o.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projectRoot, projectSettings)];
                case 1:
                    _o.sent();
                    settings = { resourceName: "".concat(projectPrefix).concat((0, import_helpers_1.getShortId)()) };
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addNotificationChannel)(projectRoot, settings, testChannelSelection)];
                case 2:
                    _o.sent();
                    appId = (0, amplify_e2e_core_1.getAppId)(projectRoot);
                    expect(appId).toBeDefined();
                    // InAppMessaging does not deploy inline, so we must push manually
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projectRoot)];
                case 3:
                    // InAppMessaging does not deploy inline, so we must push manually
                    _o.sent();
                    // expect that Notifications, Analytics, and Auth categories are shown
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyStatus)(projectRoot, 'Notifications')];
                case 4:
                    // expect that Notifications, Analytics, and Auth categories are shown
                    _o.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyStatus)(projectRoot, 'Analytics')];
                case 5:
                    _o.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyStatus)(projectRoot, 'Auth')];
                case 6:
                    _o.sent();
                    meta = (0, amplify_e2e_core_1.getBackendAmplifyMeta)(projectRoot);
                    inAppMessagingMeta = (_b = (_a = meta.notifications[settings.resourceName]) === null || _a === void 0 ? void 0 : _a.output) === null || _b === void 0 ? void 0 : _b.InAppMessaging;
                    analyticsMeta = (_c = meta.analytics[settings.resourceName]) === null || _c === void 0 ? void 0 : _c.output;
                    expect(inAppMessagingMeta).toBeDefined();
                    expect(analyticsMeta).toBeDefined();
                    expect(inAppMessagingMeta.Enabled).toBe(true);
                    expect(inAppMessagingMeta.ApplicationId).toEqual(analyticsMeta.Id);
                    teamInfo = (0, amplify_e2e_core_1.getTeamProviderInfo)(projectRoot);
                    pinpointId = (_f = (_e = (_d = teamInfo[envName].categories) === null || _d === void 0 ? void 0 : _d.notifications) === null || _e === void 0 ? void 0 : _e.Pinpoint) === null || _f === void 0 ? void 0 : _f.Id;
                    expect(pinpointId).toBeDefined();
                    expect(pinpointId).toEqual(analyticsMeta.Id);
                    // remove in-app messaging only but don't push yet
                    return [4 /*yield*/, (0, amplify_e2e_core_1.removeNotificationChannel)(projectRoot, testChannelSelection)];
                case 7:
                    // remove in-app messaging only but don't push yet
                    _o.sent();
                    updatedMeta = (0, amplify_e2e_core_1.getBackendAmplifyMeta)(projectRoot);
                    updatedInAppMsgMeta = (_h = (_g = updatedMeta.notifications[settings.resourceName]) === null || _g === void 0 ? void 0 : _g.output) === null || _h === void 0 ? void 0 : _h.InAppMessaging;
                    expect(updatedInAppMsgMeta).toBeDefined();
                    expect(updatedInAppMsgMeta.Enabled).toBe(false);
                    // amplify status should detect that we haven't pushed yet & show Update status
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyStatus)(projectRoot, 'Update')];
                case 8:
                    // amplify status should detect that we haven't pushed yet & show Update status
                    _o.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getProjectMeta)(projectRoot)];
                case 9:
                    cloudBackendMeta = _o.sent();
                    cloudBackendInAppMsgMeta = (_k = (_j = cloudBackendMeta.notifications[settings.resourceName]) === null || _j === void 0 ? void 0 : _j.output) === null || _k === void 0 ? void 0 : _k.InAppMessaging;
                    expect(cloudBackendInAppMsgMeta).toBeDefined();
                    expect(cloudBackendInAppMsgMeta.Enabled).toBe(true);
                    // push local changes to disable in-app messaging
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projectRoot)];
                case 10:
                    // push local changes to disable in-app messaging
                    _o.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getProjectMeta)(projectRoot)];
                case 11:
                    updatedCloudBackendMeta = _o.sent();
                    updatedCloudBackendInAppMsgMeta = (_m = (_l = updatedCloudBackendMeta.notifications[settings.resourceName]) === null || _l === void 0 ? void 0 : _l.output) === null || _m === void 0 ? void 0 : _m.InAppMessaging;
                    expect(updatedCloudBackendInAppMsgMeta).toBeDefined();
                    expect(updatedCloudBackendInAppMsgMeta.Enabled).toBe(false);
                    // make sure Notifications/Analytics/Auth still show up in status
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyStatus)(projectRoot, 'Notifications')];
                case 12:
                    // make sure Notifications/Analytics/Auth still show up in status
                    _o.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyStatus)(projectRoot, 'Analytics')];
                case 13:
                    _o.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyStatus)(projectRoot, 'Auth')];
                case 14:
                    _o.sent();
                    // this will remove notifications inline, so both local/cloud will be updated
                    return [4 /*yield*/, (0, amplify_e2e_core_1.removeAllNotificationChannel)(projectRoot)];
                case 15:
                    // this will remove notifications inline, so both local/cloud will be updated
                    _o.sent();
                    // analytics/auth should still exist
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyStatus)(projectRoot, 'Analytics')];
                case 16:
                    // analytics/auth should still exist
                    _o.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyStatus)(projectRoot, 'Auth')];
                case 17:
                    _o.sent();
                    finalLocalMeta = (0, amplify_e2e_core_1.getBackendAmplifyMeta)(projectRoot);
                    expect(finalLocalMeta.notifications).toBeUndefined();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getProjectMeta)(projectRoot)];
                case 18:
                    endCloudBackendMeta = _o.sent();
                    expect(endCloudBackendMeta.notifications).toBeUndefined();
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=notifications-in-app-messaging.test.js.map