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
describe('nodejs', function () {
    describe('amplify add function with additional permissions', function () {
        var projRoot;
        beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('fn-with-perm')];
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
        it('add lambda with AdminQueries API permissions', function () { return __awaiter(void 0, void 0, void 0, function () {
            var fnName, meta, _a, functionArn, functionName, region, cloudFunction;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, {})];
                    case 1:
                        _b.sent();
                        fnName = "integtestfn".concat((0, amplify_e2e_core_1.generateRandomShortId)());
                        return [4 /*yield*/, (0, amplify_e2e_core_1.addAuthWithGroupsAndAdminAPI)(projRoot)];
                    case 2:
                        _b.sent();
                        return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, {
                                name: fnName,
                                functionTemplate: 'Hello World',
                                additionalPermissions: {
                                    permissions: ['api'],
                                    resources: ['AdminQueries'],
                                    choices: ['auth', 'function', 'api'],
                                    operations: ['create', 'update', 'read', 'delete'],
                                },
                            }, 'nodejs')];
                    case 3:
                        _b.sent();
                        return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                    case 4:
                        _b.sent();
                        meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                        _a = Object.keys(meta.function).map(function (key) { return meta.function[key]; })[0].output, functionArn = _a.Arn, functionName = _a.Name, region = _a.Region;
                        expect(functionArn).toBeDefined();
                        expect(functionName).toBeDefined();
                        expect(region).toBeDefined();
                        return [4 /*yield*/, (0, amplify_e2e_core_1.getFunction)(functionName, region)];
                    case 5:
                        cloudFunction = _b.sent();
                        expect(cloudFunction.Configuration.FunctionArn).toEqual(functionArn);
                        return [2 /*return*/];
                }
            });
        }); });
        it('lambda with s3 permissions should be able to call listObjects', function () { return __awaiter(void 0, void 0, void 0, function () {
            var random, fnName, s3Name, options, functionCode, meta, _a, bucketName, region, functionName, result1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, {})];
                    case 1:
                        _b.sent();
                        random = (0, amplify_e2e_core_1.generateRandomShortId)();
                        fnName = "integtestfn".concat(random);
                        s3Name = "integtestfn".concat(random);
                        options = {
                            resourceName: s3Name,
                            bucketName: s3Name,
                        };
                        return [4 /*yield*/, (0, amplify_e2e_core_1.addAuthWithDefault)(projRoot)];
                    case 2:
                        _b.sent();
                        return [4 /*yield*/, (0, amplify_e2e_core_1.addS3StorageWithSettings)(projRoot, options)];
                    case 3:
                        _b.sent();
                        return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, {
                                name: fnName,
                                functionTemplate: 'Hello World',
                                additionalPermissions: {
                                    permissions: ['storage'],
                                    resources: [s3Name],
                                    choices: ['auth', 'storage', 'function', 'api'],
                                    operations: ['create', 'update', 'read', 'delete'],
                                },
                            }, 'nodejs')];
                    case 4:
                        _b.sent();
                        functionCode = (0, amplify_e2e_core_1.loadFunctionTestFile)('s3-list-objects.js');
                        // Update the env var name in function code
                        functionCode.replace('{{bucketEnvVar}}', "STORAGE_INTEGTESTFN".concat(random, "_BUCKETNAME"));
                        (0, amplify_e2e_core_1.overrideFunctionSrcNode)(projRoot, fnName, functionCode);
                        return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushForce)(projRoot)];
                    case 5:
                        _b.sent();
                        meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                        _a = Object.keys(meta.storage).map(function (key) { return meta.storage[key]; })[0].output, bucketName = _a.BucketName, region = _a.Region;
                        expect(bucketName).toBeDefined();
                        expect(region).toBeDefined();
                        functionName = Object.keys(meta.function).map(function (key) { return meta.function[key]; })[0].output.Name;
                        expect(functionName).toBeDefined();
                        return [4 /*yield*/, (0, amplify_e2e_core_1.invokeFunction)(functionName, null, region)];
                    case 6:
                        result1 = _b.sent();
                        expect(result1.StatusCode).toBe(200);
                        expect(result1.Payload).toBeDefined();
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
//# sourceMappingURL=function_2a.test.js.map