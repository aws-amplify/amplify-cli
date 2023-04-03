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
describe('notification category lifecycle test', function () {
    var projectPrefix = "notificationLifecycle".substring(0, 19);
    var projectSettings = {
        name: projectPrefix,
        disableAmplifyAppCreation: false,
    };
    var projectRoot;
    var pullTestProjectRoot;
    var deleteNeeded = false;
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
                case 0:
                    if (!deleteNeeded) return [3 /*break*/, 2];
                    return [4 /*yield*/, (0, amplify_e2e_core_1.deleteProject)(projectRoot)];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2:
                    (0, amplify_e2e_core_1.deleteProjectDir)(projectRoot);
                    if (pullTestProjectRoot) {
                        (0, amplify_e2e_core_1.deleteProjectDir)(pullTestProjectRoot);
                    }
                    return [2 /*return*/];
            }
        });
    }); });
    it("should create & delete resources correctly", function () { return __awaiter(void 0, void 0, void 0, function () {
        var settings, appId, _a, stackId, region, stack;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projectRoot, projectSettings)];
                case 1:
                    _b.sent();
                    deleteNeeded = true;
                    settings = { resourceName: "".concat(projectPrefix).concat((0, import_helpers_1.getShortId)()) };
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addNotificationChannel)(projectRoot, settings, 'In-App Messaging')];
                case 2:
                    _b.sent();
                    appId = (0, amplify_e2e_core_1.getAppId)(projectRoot);
                    expect(appId).toBeDefined();
                    // InAppMessaging does not deploy inline, so we must push manually
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projectRoot)];
                case 3:
                    // InAppMessaging does not deploy inline, so we must push manually
                    _b.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)("notification-pull".concat((0, import_helpers_1.getShortId)()))];
                case 4:
                    // Test that backend resources match local configurations
                    pullTestProjectRoot = _b.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPull)(pullTestProjectRoot, { override: false, emptyDir: true, appId: appId })];
                case 5:
                    _b.sent();
                    (0, import_helpers_1.expectLocalAndPulledBackendConfigMatching)(projectRoot, pullTestProjectRoot);
                    (0, import_helpers_1.expectLocalAndPulledBackendAmplifyMetaMatching)(projectRoot, pullTestProjectRoot);
                    (0, import_helpers_1.expectLocalAndPulledAwsExportsMatching)(projectRoot, pullTestProjectRoot);
                    _a = (0, amplify_e2e_core_1.getProjectMeta)(projectRoot).providers.awscloudformation, stackId = _a.StackId, region = _a.Region;
                    return [4 /*yield*/, (0, amplify_e2e_core_1.deleteProject)(projectRoot)];
                case 6:
                    _b.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.describeCloudFormationStack)(stackId, region)];
                case 7:
                    stack = _b.sent();
                    expect(stack.StackStatus).toEqual('DELETE_COMPLETE');
                    deleteNeeded = false;
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=notifications-lifecycle.test.js.map