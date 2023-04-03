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
/* eslint-disable spellcheck/spell-checker */
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
var import_helpers_1 = require("../import-helpers");
var profileName = 'amplify-integ-test-user';
var PROJECT_NAME = 'authTest';
var defaultsSettings = {
    name: PROJECT_NAME,
    disableAmplifyAppCreation: false,
};
describe('import cases when userPool is deleted', function () {
    var projRoot;
    var projRoot2;
    var ogProjectSettings;
    var ogProjectRoot;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        var ogProjectPrefix1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    ogProjectPrefix1 = 'ogauimphea';
                    ogProjectSettings = {
                        name: ogProjectPrefix1,
                        disableAmplifyAppCreation: false,
                    };
                    return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)(ogProjectSettings.name)];
                case 1:
                    ogProjectRoot = _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(ogProjectRoot, ogProjectSettings)];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    afterEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.deleteProject)(projRoot)];
                case 1:
                    _a.sent();
                    (0, amplify_e2e_core_1.deleteProjectDir)(projRoot);
                    (0, amplify_e2e_core_1.deleteProjectDir)(projRoot2);
                    return [2 /*return*/];
            }
        });
    }); });
    it('check headless case if imported userPool is deleted', function () { return __awaiter(void 0, void 0, void 0, function () {
        var ogProjectDetails, importAuthRequest, projectDetails, ogProjectPrefix2, appId, authResourceName;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, import_helpers_1.setupOgProjectWithAuth)(ogProjectRoot, ogProjectSettings, false)];
                case 1:
                    ogProjectDetails = _a.sent();
                    importAuthRequest = {
                        version: 1,
                        userPoolId: ogProjectDetails.meta.UserPoolId,
                        nativeClientId: ogProjectDetails.meta.AppClientID,
                        webClientId: ogProjectDetails.meta.AppClientIDWeb,
                    };
                    return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('auth-import-delete')];
                case 2:
                    // create another app whch import previous app userpool
                    projRoot = _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, defaultsSettings)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.headlessAuthImport)(projRoot, importAuthRequest)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                case 5:
                    _a.sent();
                    projectDetails = (0, import_helpers_1.getAuthProjectDetails)(projRoot);
                    (0, import_helpers_1.expectAuthProjectDetailsMatch)(projectDetails, ogProjectDetails);
                    (0, import_helpers_1.expectLocalAndCloudMetaFilesMatching)(projRoot);
                    // deleting App and userPool
                    return [4 /*yield*/, (0, amplify_e2e_core_1.deleteProject)(ogProjectRoot)];
                case 6:
                    // deleting App and userPool
                    _a.sent();
                    (0, amplify_e2e_core_1.deleteProjectDir)(ogProjectRoot);
                    ogProjectPrefix2 = 'removeuserPool2';
                    ogProjectSettings = {
                        name: ogProjectPrefix2,
                    };
                    return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)(ogProjectSettings.name)];
                case 7:
                    projRoot2 = _a.sent();
                    appId = (0, amplify_e2e_core_1.getAppId)(projRoot);
                    // should succeed and removes auth from local state
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyStudioHeadlessPull)(projRoot2, {
                            appId: appId,
                            envName: 'integtest',
                            profileName: profileName,
                        })];
                case 8:
                    // should succeed and removes auth from local state
                    _a.sent();
                    authResourceName = projectDetails.authResourceName;
                    return [4 /*yield*/, (0, import_helpers_1.removeImportedAuthHeadless)(projRoot2, authResourceName)];
                case 9:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot2)];
                case 10:
                    _a.sent();
                    (0, import_helpers_1.expectNoAuthInMeta)(projRoot2);
                    (0, import_helpers_1.expectLocalTeamInfoHasNoCategories)(projRoot2);
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=auth_12.test.js.map