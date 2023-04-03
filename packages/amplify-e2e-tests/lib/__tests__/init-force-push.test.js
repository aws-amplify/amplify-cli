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
describe('init --forcePush', function () {
    var envName = 'testtest';
    var projRoot;
    var funcName;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('original')];
                case 1:
                    projRoot = _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, { envName: envName, disableAmplifyAppCreation: false })];
                case 2:
                    _a.sent();
                    funcName = "testfunction".concat((0, amplify_e2e_core_1.generateRandomShortId)());
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, {
                            functionTemplate: 'Hello World',
                            name: funcName,
                            environmentVariables: {
                                key: 'FOO_BAR',
                                value: 'fooBar',
                            },
                        }, 'nodejs')];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                case 4:
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
                    return [2 /*return*/];
            }
        });
    }); });
    it('fails fast on missing env parameters', function () { return __awaiter(void 0, void 0, void 0, function () {
        var projectName, tpi, meta, _a, appId, region, result;
        var _b, _c, _d, _e, _f;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    projectName = (0, amplify_e2e_core_1.getProjectConfig)(projRoot).projectName;
                    tpi = (0, amplify_e2e_core_1.getTeamProviderInfo)(projRoot);
                    (_e = (_d = (_c = (_b = tpi === null || tpi === void 0 ? void 0 : tpi[envName]) === null || _b === void 0 ? void 0 : _b.categories) === null || _c === void 0 ? void 0 : _c.function) === null || _d === void 0 ? void 0 : _d[funcName]) === null || _e === void 0 ? true : delete _e.fooBar;
                    (0, amplify_e2e_core_1.setTeamProviderInfo)(projRoot, tpi);
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    _a = (_f = meta === null || meta === void 0 ? void 0 : meta.providers) === null || _f === void 0 ? void 0 : _f.awscloudformation, appId = _a.AmplifyAppId, region = _a.Region;
                    return [4 /*yield*/, (0, amplify_e2e_core_1.deleteSSMParameter)(region, appId, 'testtest', 'function', funcName, 'fooBar')];
                case 1:
                    _g.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.nonInteractiveInitWithForcePushAttach)(projRoot, (0, amplify_e2e_core_1.getAmplifyInitConfig)(projectName, 'newenv'), undefined, true, undefined, false)];
                case 2:
                    result = _g.sent();
                    expect(result.exitCode).toBe(1);
                    return [2 /*return*/];
            }
        });
    }); });
    it('restores missing param from ParameterStore', function () { return __awaiter(void 0, void 0, void 0, function () {
        var projectName, tpi, tpiAfter;
        var _a, _b, _c, _d, _e, _f, _g, _h;
        return __generator(this, function (_j) {
            switch (_j.label) {
                case 0:
                    projectName = (0, amplify_e2e_core_1.getProjectConfig)(projRoot).projectName;
                    tpi = (0, amplify_e2e_core_1.getTeamProviderInfo)(projRoot);
                    (_d = (_c = (_b = (_a = tpi === null || tpi === void 0 ? void 0 : tpi[envName]) === null || _a === void 0 ? void 0 : _a.categories) === null || _b === void 0 ? void 0 : _b.function) === null || _c === void 0 ? void 0 : _c[funcName]) === null || _d === void 0 ? true : delete _d.fooBar;
                    (0, amplify_e2e_core_1.setTeamProviderInfo)(projRoot, tpi);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.nonInteractiveInitWithForcePushAttach)(projRoot, (0, amplify_e2e_core_1.getAmplifyInitConfig)(projectName, envName), undefined, true)];
                case 1:
                    _j.sent();
                    tpiAfter = (0, amplify_e2e_core_1.getTeamProviderInfo)(projRoot);
                    expect((_h = (_g = (_f = (_e = tpiAfter === null || tpiAfter === void 0 ? void 0 : tpiAfter[envName]) === null || _e === void 0 ? void 0 : _e.categories) === null || _f === void 0 ? void 0 : _f.function) === null || _g === void 0 ? void 0 : _g[funcName]) === null || _h === void 0 ? void 0 : _h.fooBar).toBe('fooBar');
                    return [2 /*return*/];
            }
        });
    }); });
    it('succeeds in git cloned project', function () { return __awaiter(void 0, void 0, void 0, function () {
        var projectName;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    projectName = (0, amplify_e2e_core_1.getProjectConfig)(projRoot).projectName;
                    return [4 /*yield*/, (0, amplify_e2e_core_1.gitInit)(projRoot)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.gitCommitAll)(projRoot)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.gitCleanFdx)(projRoot)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.nonInteractiveInitWithForcePushAttach)(projRoot, (0, amplify_e2e_core_1.getAmplifyInitConfig)(projectName, envName), undefined, true)];
                case 4:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=init-force-push.test.js.map