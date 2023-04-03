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
var amplify_cli_core_1 = require("amplify-cli-core");
describe('amplify configure project tests', function () {
    var projRoot;
    var envName = 'integtest';
    beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('configProjTest')];
                case 1:
                    projRoot = _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, { envName: envName })];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    afterAll(function () { return __awaiter(void 0, void 0, void 0, function () {
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
    it('should update the project to use access keys', function () { return __awaiter(void 0, void 0, void 0, function () {
        var projectConfigForEnv;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyConfigureProject)({ cwd: projRoot, profileOption: 'Update AWS Profile', authenticationOption: 'AWS access keys' })];
                case 1:
                    _a.sent();
                    projectConfigForEnv = getLocalAwsInfoForEnv(projRoot, envName);
                    expect(projectConfigForEnv).toBeDefined();
                    expect(projectConfigForEnv.configLevel).toBe('project');
                    expect(projectConfigForEnv.useProfile).toBe(false);
                    expect(projectConfigForEnv.awsConfigFilePath).toBeDefined();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should update the project to use a profile', function () { return __awaiter(void 0, void 0, void 0, function () {
        var projectConfigForEnv;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyConfigureProject)({ cwd: projRoot, profileOption: 'Update AWS Profile', authenticationOption: 'AWS profile' })];
                case 1:
                    _a.sent();
                    projectConfigForEnv = getLocalAwsInfoForEnv(projRoot, envName);
                    expect(projectConfigForEnv).toBeDefined();
                    expect(projectConfigForEnv.configLevel).toBe('project');
                    expect(projectConfigForEnv.useProfile).toBe(true);
                    expect(projectConfigForEnv.profileName).toBeDefined();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should update the project to remove a profile', function () { return __awaiter(void 0, void 0, void 0, function () {
        var projectConfigForEnv;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyConfigureProject)({ cwd: projRoot, profileOption: 'Remove AWS Profile' })];
                case 1:
                    _a.sent();
                    projectConfigForEnv = getLocalAwsInfoForEnv(projRoot, envName);
                    expect(projectConfigForEnv).toBeDefined();
                    expect(projectConfigForEnv.configLevel).toBe('general');
                    return [2 /*return*/];
            }
        });
    }); });
    it('should update the project to add access keys when configLevel is general', function () { return __awaiter(void 0, void 0, void 0, function () {
        var projectConfigForEnv;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyConfigureProject)({ cwd: projRoot, configLevel: 'general', authenticationOption: 'AWS access keys' })];
                case 1:
                    _a.sent();
                    projectConfigForEnv = getLocalAwsInfoForEnv(projRoot, envName);
                    expect(projectConfigForEnv).toBeDefined();
                    expect(projectConfigForEnv.configLevel).toBe('project');
                    expect(projectConfigForEnv.useProfile).toBe(false);
                    expect(projectConfigForEnv.awsConfigFilePath).toBeDefined();
                    return [2 /*return*/];
            }
        });
    }); });
    // Set to profile last or deletProject() in afterAll() will fail
    it('should update the project to use a profile', function () { return __awaiter(void 0, void 0, void 0, function () {
        var projectConfigForEnv;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyConfigureProject)({ cwd: projRoot, profileOption: 'Update AWS Profile', authenticationOption: 'AWS profile' })];
                case 1:
                    _a.sent();
                    projectConfigForEnv = getLocalAwsInfoForEnv(projRoot, envName);
                    expect(projectConfigForEnv).toBeDefined();
                    expect(projectConfigForEnv.configLevel).toBe('project');
                    expect(projectConfigForEnv.useProfile).toBe(true);
                    expect(projectConfigForEnv.profileName).toBeDefined();
                    return [2 /*return*/];
            }
        });
    }); });
});
function getLocalAwsInfoForEnv(projRoot, envName) {
    return amplify_cli_core_1.stateManager.getLocalAWSInfo(projRoot)[envName];
}
//# sourceMappingURL=configure-project.test.js.map