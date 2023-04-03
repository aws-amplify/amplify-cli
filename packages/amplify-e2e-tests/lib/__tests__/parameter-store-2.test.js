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
describe('parameters in Parameter Store', function () {
    var projRoot;
    var envName = 'enva';
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('multi-env')];
                case 1:
                    projRoot = _a.sent();
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
    it('hydrates missing parameters into TPI on pull', function () { return __awaiter(void 0, void 0, void 0, function () {
        var meta, appId, region, envVariableName, envVariableValue, fnName, expectedParamsAfterPush, preCleanTpi, postPullWithRestoreTpi, postPullWithoutRestoreTpi, _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, { disableAmplifyAppCreation: false, envName: envName })];
                case 1:
                    _c.sent();
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    expect(meta).toBeDefined();
                    appId = (0, amplify_e2e_core_1.getAppId)(projRoot);
                    expect(appId).toBeDefined();
                    region = meta.providers.awscloudformation.Region;
                    expect(region).toBeDefined();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.gitInit)(projRoot)];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.gitCommitAll)(projRoot)];
                case 3:
                    _c.sent(); // commit all just after init, so no categories block exists in TPI yet
                    envVariableName = 'envVariableName';
                    envVariableValue = 'envVariableValue';
                    fnName = "parameterstestfn".concat((0, amplify_e2e_core_1.generateRandomShortId)());
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, {
                            name: fnName,
                            functionTemplate: 'Hello World',
                            environmentVariables: {
                                key: envVariableName,
                                value: envVariableValue,
                            },
                        }, 'nodejs')];
                case 4:
                    _c.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addAuthWithEmailVerificationAndUserPoolGroupTriggers)(projRoot)];
                case 5:
                    _c.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                case 6:
                    _c.sent();
                    expectedParamsAfterPush = [
                        { name: 'deploymentBucketName' },
                        { name: envVariableName, value: envVariableValue },
                        { name: 's3Key' },
                    ];
                    return [4 /*yield*/, (0, amplify_e2e_core_1.expectParametersOptionalValue)(expectedParamsAfterPush, [], region, appId, envName, 'function', fnName)];
                case 7:
                    _c.sent();
                    preCleanTpi = (0, amplify_e2e_core_1.getTeamProviderInfo)(projRoot);
                    // test pull --restore same dir
                    return [4 /*yield*/, (0, amplify_e2e_core_1.gitCleanFdx)(projRoot)];
                case 8:
                    // test pull --restore same dir
                    _c.sent(); // clear TPI
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPull)(projRoot, { appId: appId, envName: envName, withRestore: true, emptyDir: true })];
                case 9:
                    _c.sent();
                    postPullWithRestoreTpi = (0, amplify_e2e_core_1.getTeamProviderInfo)(projRoot);
                    expect(postPullWithRestoreTpi).toEqual(preCleanTpi);
                    // test pull same dir
                    return [4 /*yield*/, (0, amplify_e2e_core_1.gitCleanFdx)(projRoot)];
                case 10:
                    // test pull same dir
                    _c.sent(); // clear TPI
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPull)(projRoot, { appId: appId, envName: envName, withRestore: false, emptyDir: true })];
                case 11:
                    _c.sent();
                    postPullWithoutRestoreTpi = (0, amplify_e2e_core_1.getTeamProviderInfo)(projRoot);
                    expect(postPullWithoutRestoreTpi).toEqual(preCleanTpi);
                    _a = expect;
                    return [4 /*yield*/, getTpiAfterPullInEmptyDir(appId, envName, true)];
                case 12:
                    _a.apply(void 0, [_c.sent()]).toEqual(preCleanTpi);
                    _b = expect;
                    return [4 /*yield*/, getTpiAfterPullInEmptyDir(appId, envName, false)];
                case 13:
                    _b.apply(void 0, [_c.sent()]).toEqual(preCleanTpi);
                    return [2 /*return*/];
            }
        });
    }); });
    var getTpiAfterPullInEmptyDir = function (appId, envName, withRestore) { return __awaiter(void 0, void 0, void 0, function () {
        var emptyDir;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, , 3, 4]);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('empty-dir-parameters-test')];
                case 1:
                    emptyDir = _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPull)(emptyDir, { appId: appId, envName: envName, withRestore: withRestore, emptyDir: true })];
                case 2:
                    _a.sent();
                    return [2 /*return*/, (0, amplify_e2e_core_1.getTeamProviderInfo)(emptyDir)];
                case 3:
                    (0, amplify_e2e_core_1.deleteProjectDir)(emptyDir);
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    }); };
});
//# sourceMappingURL=parameter-store-2.test.js.map