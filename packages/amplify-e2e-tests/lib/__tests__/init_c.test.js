"use strict";
/* eslint-disable spellcheck/spell-checker */
/* eslint-disable import/no-extraneous-dependencies */
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
describe('amplify init c', function () {
    var projRoot;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('init')];
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
    it('should init project without profile', function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, meta, AuthRoleName, UnauthRoleName, UnauthRoleArn, AuthRoleArn, DeploymentBucketName, newEnvMeta, newEnvAuthRoleName, newEnvUnAuthRoleName, newEnvUnauthRoleArn, newEnvAuthRoleArn, newEnvDeploymentBucketName;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = (0, amplify_e2e_core_1.getEnvVars)(), AWS_ACCESS_KEY_ID = _a.AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY = _a.AWS_SECRET_ACCESS_KEY;
                    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
                        throw new Error('Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY either in .env file or as Environment variable');
                    }
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initProjectWithAccessKey)(projRoot, {
                            accessKeyId: AWS_ACCESS_KEY_ID,
                            secretAccessKey: AWS_SECRET_ACCESS_KEY,
                        })];
                case 1:
                    _b.sent();
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot).providers.awscloudformation;
                    expect(meta.Region).toBeDefined();
                    AuthRoleName = meta.AuthRoleName, UnauthRoleName = meta.UnauthRoleName, UnauthRoleArn = meta.UnauthRoleArn, AuthRoleArn = meta.AuthRoleArn, DeploymentBucketName = meta.DeploymentBucketName;
                    expect(UnauthRoleName).toBeIAMRoleWithArn(UnauthRoleArn);
                    expect(AuthRoleName).toBeIAMRoleWithArn(AuthRoleArn);
                    expect(DeploymentBucketName).toBeAS3Bucket(DeploymentBucketName);
                    // init new env
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initNewEnvWithAccessKey)(projRoot, {
                            envName: 'foo',
                            accessKeyId: AWS_ACCESS_KEY_ID,
                            secretAccessKey: AWS_SECRET_ACCESS_KEY,
                        })];
                case 2:
                    // init new env
                    _b.sent();
                    newEnvMeta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot).providers.awscloudformation;
                    newEnvAuthRoleName = newEnvMeta.AuthRoleName, newEnvUnAuthRoleName = newEnvMeta.UnauthRoleName, newEnvUnauthRoleArn = newEnvMeta.UnauthRoleArn, newEnvAuthRoleArn = newEnvMeta.AuthRoleArn, newEnvDeploymentBucketName = newEnvMeta.DeploymentBucketName;
                    expect(newEnvAuthRoleName).not.toEqual(AuthRoleName);
                    expect(UnauthRoleName).not.toEqual(newEnvUnAuthRoleName);
                    expect(UnauthRoleArn).not.toEqual(newEnvUnauthRoleArn);
                    expect(AuthRoleArn).not.toEqual(newEnvAuthRoleArn);
                    expect(DeploymentBucketName).not.toEqual(newEnvDeploymentBucketName);
                    expect(newEnvUnAuthRoleName).toBeIAMRoleWithArn(newEnvUnauthRoleArn);
                    expect(newEnvAuthRoleName).toBeIAMRoleWithArn(newEnvAuthRoleArn);
                    expect(newEnvDeploymentBucketName).toBeAS3Bucket(DeploymentBucketName);
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=init_c.test.js.map