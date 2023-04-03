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
var lodash_1 = __importDefault(require("lodash"));
var env_1 = require("../environment/env");
// Using a random AWS managed policy as a permissions boundary
var permissionsBoundaryArn = 'arn:aws:iam::aws:policy/AlexaForBusinessFullAccess';
describe('iam permissions boundary', function () {
    var projRoot;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('perm-bound')];
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
    test('permissions boundary is applied to roles created by the CLI', function () { return __awaiter(void 0, void 0, void 0, function () {
        var meta, authRoleName, region, actualPermBoundary, tpi, storedArn;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, {})];
                case 1:
                    _e.sent();
                    return [4 /*yield*/, (0, env_1.updateEnvironment)(projRoot, { permissionsBoundaryArn: permissionsBoundaryArn })];
                case 2:
                    _e.sent();
                    // adding a function isn't strictly part of the test, it just causes the project to have changes to push
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, { functionTemplate: 'Hello World' }, 'nodejs')];
                case 3:
                    // adding a function isn't strictly part of the test, it just causes the project to have changes to push
                    _e.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                case 4:
                    _e.sent();
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    authRoleName = (_b = (_a = meta === null || meta === void 0 ? void 0 : meta.providers) === null || _a === void 0 ? void 0 : _a.awscloudformation) === null || _b === void 0 ? void 0 : _b.AuthRoleName;
                    region = (_d = (_c = meta === null || meta === void 0 ? void 0 : meta.providers) === null || _c === void 0 ? void 0 : _c.awscloudformation) === null || _d === void 0 ? void 0 : _d.Region;
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getPermissionsBoundary)(authRoleName, region)];
                case 5:
                    actualPermBoundary = _e.sent();
                    expect(actualPermBoundary).toEqual(permissionsBoundaryArn);
                    tpi = (0, amplify_e2e_core_1.getTeamProviderInfo)(projRoot);
                    storedArn = lodash_1.default.get(tpi, ['integtest', 'awscloudformation', 'PermissionsBoundaryPolicyArn']);
                    expect(storedArn).toEqual(permissionsBoundaryArn);
                    return [2 /*return*/];
            }
        });
    }); });
    test('permissions boundary is applied during headless init', function () { return __awaiter(void 0, void 0, void 0, function () {
        var meta, authRoleName, region, actualPermBoundary, tpi, storedArn;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, { permissionsBoundaryArn: permissionsBoundaryArn })];
                case 1:
                    _e.sent();
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    authRoleName = (_b = (_a = meta === null || meta === void 0 ? void 0 : meta.providers) === null || _a === void 0 ? void 0 : _a.awscloudformation) === null || _b === void 0 ? void 0 : _b.AuthRoleName;
                    region = (_d = (_c = meta === null || meta === void 0 ? void 0 : meta.providers) === null || _c === void 0 ? void 0 : _c.awscloudformation) === null || _d === void 0 ? void 0 : _d.Region;
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getPermissionsBoundary)(authRoleName, region)];
                case 2:
                    actualPermBoundary = _e.sent();
                    expect(actualPermBoundary).toEqual(permissionsBoundaryArn);
                    tpi = (0, amplify_e2e_core_1.getTeamProviderInfo)(projRoot);
                    storedArn = lodash_1.default.get(tpi, ['integtest', 'awscloudformation', 'PermissionsBoundaryPolicyArn']);
                    expect(storedArn).toEqual(permissionsBoundaryArn);
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=iam-permissions-boundary.test.js.map