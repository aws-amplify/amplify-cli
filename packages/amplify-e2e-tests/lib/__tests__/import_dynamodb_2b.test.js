"use strict";
/* eslint-disable spellcheck/spell-checker */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
describe('dynamodb import 2b', function () {
    var projectPrefix = 'ddbimp';
    var ogProjectPrefix = 'ogddbimp';
    var projectSettings = {
        name: projectPrefix,
    };
    var ogProjectSettings = {
        name: ogProjectPrefix,
    };
    var dummyOGProjectSettings = {
        name: 'dummyog1',
    };
    // OG is the CLI project that creates the dynamodb tables to import by other test projects
    var ogProjectRoot;
    var ogShortId;
    var ogSettings;
    // We need an extra OG project to make sure that autocomplete prompt hits in
    var dummyOGProjectRoot;
    var dummyOGShortId;
    var dummyOGSettings;
    var projectRoot;
    var ignoreProjectDeleteErrors = false;
    beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)(ogProjectSettings.name)];
                case 1:
                    ogProjectRoot = _a.sent();
                    ogShortId = (0, import_helpers_1.getShortId)();
                    ogSettings = (0, import_helpers_1.createDynamoDBSettings)(ogProjectSettings.name, ogShortId);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(ogProjectRoot, ogProjectSettings)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addAuthWithDefault)(ogProjectRoot)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addDynamoDBWithGSIWithSettings)(ogProjectRoot, ogSettings)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(ogProjectRoot)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)(dummyOGProjectSettings.name)];
                case 6:
                    dummyOGProjectRoot = _a.sent();
                    dummyOGShortId = (0, import_helpers_1.getShortId)();
                    dummyOGSettings = (0, import_helpers_1.createDynamoDBSettings)(dummyOGProjectSettings.name, dummyOGShortId);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(dummyOGProjectRoot, dummyOGProjectSettings)];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addAuthWithDefault)(dummyOGProjectRoot)];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addDynamoDBWithGSIWithSettings)(dummyOGProjectRoot, dummyOGSettings)];
                case 9:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(dummyOGProjectRoot)];
                case 10:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    afterAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.deleteProject)(ogProjectRoot)];
                case 1:
                    _a.sent();
                    (0, amplify_e2e_core_1.deleteProjectDir)(ogProjectRoot);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.deleteProject)(dummyOGProjectRoot)];
                case 2:
                    _a.sent();
                    (0, amplify_e2e_core_1.deleteProjectDir)(dummyOGProjectRoot);
                    return [2 /*return*/];
            }
        });
    }); });
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)(projectPrefix)];
                case 1:
                    projectRoot = _a.sent();
                    ignoreProjectDeleteErrors = false;
                    return [2 /*return*/];
            }
        });
    }); });
    afterEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.deleteProject)(projectRoot)];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    // In some tests where project initialization fails it can lead to errors on cleanup which we
                    // can ignore if set by the test
                    if (!ignoreProjectDeleteErrors) {
                        throw error_1;
                    }
                    return [3 /*break*/, 3];
                case 3:
                    (0, amplify_e2e_core_1.deleteProjectDir)(projectRoot);
                    return [2 /*return*/];
            }
        });
    }); });
    it('dynamodb headless pull in empty dir', function () { return __awaiter(void 0, void 0, void 0, function () {
        var envName, appId, storageParams1, projectRootPull, storageParams2;
        var _a, _b, _c, _d, _e, _f;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    envName = 'integtest';
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projectRoot, __assign(__assign({}, projectSettings), { disableAmplifyAppCreation: false, envName: envName }))];
                case 1:
                    _g.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addAuthWithDefault)(projectRoot)];
                case 2:
                    _g.sent();
                    return [4 /*yield*/, (0, import_helpers_1.importDynamoDBTable)(projectRoot, ogSettings.tableName)];
                case 3:
                    _g.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projectRoot)];
                case 4:
                    _g.sent();
                    appId = (0, amplify_e2e_core_1.getAppId)(projectRoot);
                    expect(appId).toBeDefined();
                    storageParams1 = (_c = (_b = (_a = (0, amplify_e2e_core_1.getTeamProviderInfo)(projectRoot)) === null || _a === void 0 ? void 0 : _a[envName]) === null || _b === void 0 ? void 0 : _b.categories) === null || _c === void 0 ? void 0 : _c.storage;
                    expect(storageParams1).toBeDefined();
                    _g.label = 5;
                case 5:
                    _g.trys.push([5, , 8, 9]);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('ddbimport-pull')];
                case 6:
                    projectRootPull = _g.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPull)(projectRootPull, { appId: appId, emptyDir: true, envName: envName, yesFlag: true })];
                case 7:
                    _g.sent();
                    storageParams2 = (_f = (_e = (_d = (0, amplify_e2e_core_1.getTeamProviderInfo)(projectRootPull)) === null || _d === void 0 ? void 0 : _d[envName]) === null || _e === void 0 ? void 0 : _e.categories) === null || _f === void 0 ? void 0 : _f.storage;
                    expect(storageParams1).toEqual(storageParams2);
                    return [3 /*break*/, 9];
                case 8:
                    (0, amplify_e2e_core_1.deleteProjectDir)(projectRootPull);
                    return [7 /*endfinally*/];
                case 9: return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=import_dynamodb_2b.test.js.map