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
describe('amplify add api (REST)', function () {
    var projRoot;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('rest-api')];
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
    it('init a project, add a DDB, then add a crud rest api', function () { return __awaiter(void 0, void 0, void 0, function () {
        var randomId, DDB_NAME, meta, _a, service, lastPushTimeStamp, lastPushDirHash;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, global.getRandomId()];
                case 1:
                    randomId = _b.sent();
                    DDB_NAME = "ddb".concat(randomId);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, {})];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addSimpleDDB)(projRoot, { name: DDB_NAME })];
                case 3:
                    _b.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addRestApi)(projRoot, { isCrud: true, projectContainsFunctions: false })];
                case 4:
                    _b.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushUpdate)(projRoot)];
                case 5:
                    _b.sent();
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    expect(meta.storage[DDB_NAME]).toBeDefined();
                    _a = meta.storage[DDB_NAME], service = _a.service, lastPushTimeStamp = _a.lastPushTimeStamp, lastPushDirHash = _a.lastPushDirHash;
                    expect(service).toBe('DynamoDB');
                    expect(lastPushTimeStamp).toBeDefined();
                    expect(lastPushDirHash).toBeDefined();
                    (0, amplify_e2e_core_1.validateRestApiMeta)(projRoot, meta);
                    return [2 /*return*/];
            }
        });
    }); });
    it('init a project, then add a serverless rest api', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, {})];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addRestApi)(projRoot, { isCrud: false })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushUpdate)(projRoot)];
                case 3:
                    _a.sent();
                    (0, amplify_e2e_core_1.validateRestApiMeta)(projRoot);
                    return [2 /*return*/];
            }
        });
    }); });
    it('init a project, create lambda and attach it to an api', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, {})];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, { functionTemplate: 'Hello World' }, 'nodejs')];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addRestApi)(projRoot, { existingLambda: true })];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushUpdate)(projRoot)];
                case 4:
                    _a.sent();
                    (0, amplify_e2e_core_1.validateRestApiMeta)(projRoot);
                    return [2 /*return*/];
            }
        });
    }); });
    it('init a project, create lambda and attach multiple rest apis', function () { return __awaiter(void 0, void 0, void 0, function () {
        var i, amplifyMeta, meta, AuthRoleName, UnauthRoleName, Region, _a, _b, authPolicies, _i, authPolicies_1, PolicyName, unauthPolicies, _c, unauthPolicies_1, PolicyName;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, {})];
                case 1:
                    _d.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, { functionTemplate: 'Hello World' }, 'nodejs')];
                case 2:
                    _d.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addRestApi)(projRoot, {
                            existingLambda: true,
                            restrictAccess: true,
                            allowGuestUsers: true,
                        })];
                case 3:
                    _d.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addRestApi)(projRoot, {
                            isFirstRestApi: false,
                            existingLambda: true,
                            restrictAccess: true,
                            allowGuestUsers: true,
                        })];
                case 4:
                    _d.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addRestApi)(projRoot, {
                            isFirstRestApi: false,
                            existingLambda: true,
                            restrictAccess: true,
                            allowGuestUsers: false,
                        })];
                case 5:
                    _d.sent();
                    i = 0;
                    _d.label = 6;
                case 6:
                    if (!(i < 15)) return [3 /*break*/, 9];
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addRestApi)(projRoot, {
                            path: "/items".concat(i),
                            isFirstRestApi: false,
                            existingLambda: true,
                            restrictAccess: true,
                            allowGuestUsers: true,
                        })];
                case 7:
                    _d.sent();
                    _d.label = 8;
                case 8:
                    i++;
                    return [3 /*break*/, 6];
                case 9: return [4 /*yield*/, (0, amplify_e2e_core_1.addRestApi)(projRoot, { isFirstRestApi: false, existingLambda: true })];
                case 10:
                    _d.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateAuthAddAdminQueries)(projRoot, undefined, {})];
                case 11:
                    _d.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushUpdate)(projRoot)];
                case 12:
                    _d.sent();
                    amplifyMeta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    meta = amplifyMeta.providers.awscloudformation;
                    AuthRoleName = meta.AuthRoleName, UnauthRoleName = meta.UnauthRoleName, Region = meta.Region;
                    _a = expect;
                    return [4 /*yield*/, (0, amplify_e2e_core_1.listRolePolicies)(AuthRoleName, Region)];
                case 13:
                    _a.apply(void 0, [_d.sent()]).toEqual([]);
                    _b = expect;
                    return [4 /*yield*/, (0, amplify_e2e_core_1.listRolePolicies)(UnauthRoleName, Region)];
                case 14:
                    _b.apply(void 0, [_d.sent()]).toEqual([]);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.listAttachedRolePolicies)(AuthRoleName, Region)];
                case 15:
                    authPolicies = _d.sent();
                    expect(authPolicies.length).toBeGreaterThan(0);
                    for (_i = 0, authPolicies_1 = authPolicies; _i < authPolicies_1.length; _i++) {
                        PolicyName = authPolicies_1[_i].PolicyName;
                        expect(PolicyName).toMatch(/PolicyAPIGWAuth\d/);
                    }
                    return [4 /*yield*/, (0, amplify_e2e_core_1.listAttachedRolePolicies)(UnauthRoleName, Region)];
                case 16:
                    unauthPolicies = _d.sent();
                    expect(unauthPolicies.length).toBeGreaterThan(0);
                    for (_c = 0, unauthPolicies_1 = unauthPolicies; _c < unauthPolicies_1.length; _c++) {
                        PolicyName = unauthPolicies_1[_c].PolicyName;
                        expect(PolicyName).toMatch(/PolicyAPIGWUnauth\d/);
                    }
                    (0, amplify_e2e_core_1.validateRestApiMeta)(projRoot, amplifyMeta);
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=api_5.test.js.map