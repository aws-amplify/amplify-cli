"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
var amplify_cli_core_1 = require("amplify-cli-core");
var fs = __importStar(require("fs-extra"));
var path = __importStar(require("path"));
var uuid_1 = require("uuid");
var node_fetch_1 = __importDefault(require("node-fetch"));
var shortId = (0, uuid_1.v4)().split('-')[0];
// eslint-disable-next-line spellcheck/spell-checker
var projName = "apigwtest".concat(shortId);
describe('API Gateway e2e tests', function () {
    var projRoot;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)(projName)];
                case 1:
                    projRoot = _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, { name: projName })];
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
                    return [2 /*return*/];
            }
        });
    }); });
    it('adds multiple rest apis and pushes', function () { return __awaiter(void 0, void 0, void 0, function () {
        var firstRestApiName, secondRestApiName, projMeta, firstRootUrl, secondRootUrl, firstItemsResponse, rootUrlResponse, secondItemsResponse, firstItemsResJson, rootUrlResJson, secondItemsResJson;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    firstRestApiName = "firstE2eRestApi".concat(shortId);
                    secondRestApiName = "secondE2eRestApi".concat(shortId);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addRestApi)(projRoot, { apiName: firstRestApiName })];
                case 1:
                    _c.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addAuthWithGroupsAndAdminAPI)(projRoot)];
                case 3:
                    _c.sent(); // Groups: Admins, Users
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                case 4:
                    _c.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addRestApi)(projRoot, { isFirstRestApi: false, path: '/', projectContainsFunctions: true })];
                case 5:
                    _c.sent(); // Add root path
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addRestApi)(projRoot, {
                            apiName: secondRestApiName,
                            isFirstRestApi: false,
                            restrictAccess: true,
                            allowGuestUsers: true,
                            hasUserPoolGroups: true,
                            projectContainsFunctions: true,
                        })];
                case 6:
                    _c.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                case 7:
                    _c.sent(); // Pushes multiple rest api updates
                    projMeta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    expect(projMeta).toBeDefined();
                    expect(projMeta.api).toBeDefined();
                    expect(projMeta.api.AdminQueries).toBeDefined();
                    expect(projMeta.api[firstRestApiName]).toBeDefined();
                    expect(projMeta.api[secondRestApiName]).toBeDefined();
                    firstRootUrl = (_a = projMeta.api[firstRestApiName].output) === null || _a === void 0 ? void 0 : _a.RootUrl;
                    secondRootUrl = (_b = projMeta.api[secondRestApiName].output) === null || _b === void 0 ? void 0 : _b.RootUrl;
                    expect(firstRootUrl).toBeDefined();
                    expect(secondRootUrl).toBeDefined();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.get)("".concat(firstRootUrl, "/items"))];
                case 8:
                    firstItemsResponse = _c.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.get)(firstRootUrl)];
                case 9:
                    rootUrlResponse = _c.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.get)("".concat(secondRootUrl, "/items"))];
                case 10:
                    secondItemsResponse = _c.sent();
                    return [4 /*yield*/, firstItemsResponse.json()];
                case 11:
                    firstItemsResJson = _c.sent();
                    return [4 /*yield*/, rootUrlResponse.json()];
                case 12:
                    rootUrlResJson = _c.sent();
                    return [4 /*yield*/, secondItemsResponse.json()];
                case 13:
                    secondItemsResJson = _c.sent();
                    expect(firstItemsResJson).toEqual({ success: 'get call succeed!', url: '/items' });
                    expect(rootUrlResJson).toEqual({ success: 'get call succeed!', url: '/' });
                    expect(secondItemsResJson).toEqual({ message: 'Missing Authentication Token' }); // Restricted API
                    return [2 /*return*/];
            }
        });
    }); });
    it('adds rest api and verify the default 4xx response', function () { return __awaiter(void 0, void 0, void 0, function () {
        var apiName, projMeta, apiPath, res;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    apiName = "integtest".concat(shortId);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addRestApi)(projRoot, {
                            apiName: apiName,
                        })];
                case 1:
                    _d.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                case 2:
                    _d.sent();
                    projMeta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    expect(projMeta).toBeDefined();
                    expect(projMeta.api).toBeDefined();
                    apiPath = (_c = (_b = (_a = projMeta === null || projMeta === void 0 ? void 0 : projMeta.api) === null || _a === void 0 ? void 0 : _a[apiName]) === null || _b === void 0 ? void 0 : _b.output) === null || _c === void 0 ? void 0 : _c.RootUrl;
                    expect(apiPath).toBeDefined();
                    return [4 /*yield*/, (0, node_fetch_1.default)(apiPath)];
                case 3:
                    res = _d.sent();
                    expect(res.status).toEqual(403);
                    expect(res.headers.get('access-control-allow-headers')).toEqual('Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token');
                    expect(res.headers.get('access-control-allow-methods')).toEqual('DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT');
                    expect(res.headers.get('access-control-allow-origin')).toEqual('*');
                    // eslint-disable-next-line spellcheck/spell-checker
                    expect(res.headers.get('access-control-expose-headers')).toEqual('Date,X-Amzn-ErrorType');
                    return [2 /*return*/];
            }
        });
    }); });
    it('adds and overrides a rest api, then pushes', function () { return __awaiter(void 0, void 0, void 0, function () {
        var restApiName, srcOverrideFilePath, destOverrideTsFilePath, cfnPath, cfn, parameters;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    restApiName = "e2eRestApi".concat(shortId);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addRestApi)(projRoot, { apiName: restApiName })];
                case 1:
                    _d.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyOverrideApi)(projRoot)];
                case 2:
                    _d.sent();
                    srcOverrideFilePath = path.join(__dirname, '..', '..', 'overrides', 'override-api-rest.ts');
                    destOverrideTsFilePath = path.join(amplify_cli_core_1.pathManager.getResourceDirectoryPath(projRoot, 'api', restApiName), 'override.ts');
                    fs.copyFileSync(srcOverrideFilePath, destOverrideTsFilePath);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.buildOverrides)(projRoot)];
                case 3:
                    _d.sent();
                    cfnPath = path.join(amplify_cli_core_1.pathManager.getResourceDirectoryPath(projRoot, 'api', restApiName), 'build', "".concat(restApiName, "-cloudformation-template.json"));
                    cfn = amplify_cli_core_1.JSONUtilities.readJson(cfnPath);
                    parameters = amplify_cli_core_1.stateManager.getResourceParametersJson(projRoot, 'api', restApiName);
                    expect(parameters.DESCRIPTION).toBeDefined();
                    expect(parameters.DESCRIPTION).toEqual({ 'Fn::Join': [' ', ['Description', 'override', 'successful']] });
                    expect((_c = (_b = (_a = cfn === null || cfn === void 0 ? void 0 : cfn.Resources) === null || _a === void 0 ? void 0 : _a[restApiName]) === null || _b === void 0 ? void 0 : _b.Properties) === null || _c === void 0 ? void 0 : _c.Description).toEqual({ Ref: 'DESCRIPTION' });
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                case 4:
                    _d.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=apigw.test.js.map