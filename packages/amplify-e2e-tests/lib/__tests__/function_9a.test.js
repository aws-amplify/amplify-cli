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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
var fs_extra_1 = __importDefault(require("fs-extra"));
var path_1 = __importDefault(require("path"));
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
        it('environment vars comment should update on permission update', function () { return __awaiter(void 0, void 0, void 0, function () {
            var funcName, ddbName, lambdaHandlerContents;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, {})];
                    case 1:
                        _a.sent();
                        funcName = "nodetestfn".concat((0, amplify_e2e_core_1.generateRandomShortId)());
                        ddbName = 'nodetestddb';
                        return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, {
                                name: funcName,
                                functionTemplate: 'Hello World',
                            }, 'nodejs')];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, (0, amplify_e2e_core_1.addSimpleDDB)(projRoot, { name: ddbName })];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, (0, amplify_e2e_core_1.updateFunction)(projRoot, {
                                additionalPermissions: {
                                    permissions: ['storage'],
                                    choices: ['function', 'storage'],
                                    operations: ['read'],
                                    resources: [ddbName],
                                },
                            }, 'nodejs')];
                    case 4:
                        _a.sent();
                        lambdaHandlerContents = fs_extra_1.default.readFileSync(path_1.default.join(projRoot, 'amplify', 'backend', 'function', funcName, 'src', 'index.js'), 'utf8');
                        expect(lambdaHandlerContents).toMatchSnapshot();
                        return [2 /*return*/];
                }
            });
        }); });
        it('adding api and storage permissions should not add duplicates to CFN', function () { return __awaiter(void 0, void 0, void 0, function () {
            var appName, random, fnName, ddbName, lambdaCFN;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        appName = (0, amplify_e2e_core_1.createRandomName)();
                        return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, {
                                name: appName,
                            })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, (0, amplify_e2e_core_1.addApiWithoutSchema)(projRoot, { transformerVersion: 1 })];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, (0, amplify_e2e_core_1.updateApiSchema)(projRoot, appName, 'two-model-schema.graphql')];
                    case 3:
                        _a.sent();
                        random = (0, amplify_e2e_core_1.generateRandomShortId)();
                        fnName = "integtestfn".concat(random);
                        ddbName = "ddbTable".concat(random);
                        return [4 /*yield*/, (0, amplify_e2e_core_1.addSimpleDDB)(projRoot, { name: ddbName })];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, {
                                name: fnName,
                                functionTemplate: 'Hello World',
                                additionalPermissions: {
                                    permissions: ['storage'],
                                    choices: ['api', 'storage'],
                                    resources: [ddbName, 'Post:@model(appsync)', 'Comment:@model(appsync)'],
                                    resourceChoices: [ddbName, 'Post:@model(appsync)', 'Comment:@model(appsync)'],
                                    operations: ['read'],
                                },
                            }, 'nodejs')];
                    case 5:
                        _a.sent();
                        lambdaCFN = (0, amplify_e2e_core_1.readJsonFile)(path_1.default.join(projRoot, 'amplify', 'backend', 'function', fnName, "".concat(fnName, "-cloudformation-template.json")));
                        expect(lambdaCFN.Resources.AmplifyResourcesPolicy.Properties.PolicyDocument.Statement.length).toBe(3);
                        return [2 /*return*/];
                }
            });
        }); });
        it('update DDB trigger function to add permissions should not changed its dependsOn attributes of the trigger source', function () { return __awaiter(void 0, void 0, void 0, function () {
            var ddbResourceName, originalAmplifyMeta, functionResourceName, originalAttributes, updateAmplifyMeta, updateAttributes, amplifyMeta;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, {})];
                    case 1:
                        _a.sent();
                        ddbResourceName = 'testddbresource';
                        return [4 /*yield*/, (0, amplify_e2e_core_1.addDDBWithTrigger)(projRoot, { ddbResourceName: ddbResourceName })];
                    case 2:
                        _a.sent();
                        originalAmplifyMeta = (0, amplify_e2e_core_1.getBackendAmplifyMeta)(projRoot);
                        functionResourceName = Object.keys(originalAmplifyMeta.function)[0];
                        originalAttributes = originalAmplifyMeta.function[functionResourceName].dependsOn[0].attributes.sort();
                        return [4 /*yield*/, (0, amplify_e2e_core_1.updateFunction)(projRoot, {
                                additionalPermissions: {
                                    resources: [ddbResourceName],
                                    permissions: ['storage'],
                                    choices: ['function', 'storage'],
                                    operations: ['read', 'update'],
                                },
                            }, 'nodejs')];
                    case 3:
                        _a.sent();
                        updateAmplifyMeta = (0, amplify_e2e_core_1.getBackendAmplifyMeta)(projRoot);
                        updateAttributes = updateAmplifyMeta.function[functionResourceName].dependsOn[0].attributes.sort();
                        expect(originalAttributes).toEqual(updateAttributes);
                        return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                    case 4:
                        _a.sent();
                        amplifyMeta = (0, amplify_e2e_core_1.getBackendAmplifyMeta)(projRoot);
                        expect(amplifyMeta.function[functionResourceName].output).toBeDefined();
                        expect(amplifyMeta.function[functionResourceName].output.Arn).toBeDefined();
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
//# sourceMappingURL=function_9a.test.js.map