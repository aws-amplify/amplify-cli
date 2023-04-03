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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var aws_sdk_1 = require("aws-sdk");
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
var fs = __importStar(require("fs-extra"));
var env_1 = require("../environment/env");
var add_1 = require("../codegen/add");
var awsExports_1 = require("../aws-exports/awsExports");
describe('amplify delete', function () {
    var projRoot;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('delete')];
                case 1:
                    projRoot = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    afterEach(function () {
        (0, amplify_e2e_core_1.deleteProjectDir)(projRoot);
    });
    it('should delete resources javascript', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, {})];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, testDeletion(projRoot, {})];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should delete resources ios', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initIosProjectWithProfile)(projRoot, {})];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, testDeletion(projRoot, { ios: true })];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should delete resources android', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initAndroidProjectWithProfile)(projRoot, {})];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, testDeletion(projRoot, { android: true })];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should delete pinpoint project', function () { return __awaiter(void 0, void 0, void 0, function () {
        var pinpointResourceName, amplifyMeta, pintpointAppId, pinpointAppExists;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initProjectForPinpoint)(projRoot)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addPinpointAnalytics)(projRoot)];
                case 2:
                    pinpointResourceName = _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.pushToCloud)(projRoot)];
                case 3:
                    _a.sent();
                    amplifyMeta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    pintpointAppId = amplifyMeta.analytics[pinpointResourceName].output.Id;
                    return [4 /*yield*/, (0, amplify_e2e_core_1.pinpointAppExist)(pintpointAppId)];
                case 4:
                    pinpointAppExists = _a.sent();
                    expect(pinpointAppExists).toBeTruthy();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyDelete)(projRoot)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, timeout(4 * 1000)];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.pinpointAppExist)(pintpointAppId)];
                case 7:
                    pinpointAppExists = _a.sent();
                    expect(pinpointAppExists).toBeFalsy();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should remove enviroment', function () { return __awaiter(void 0, void 0, void 0, function () {
        var amplifyMeta, meta, deploymentBucketName1, _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, { envName: 'testdev' })];
                case 1:
                    _c.sent();
                    return [4 /*yield*/, (0, env_1.addEnvironment)(projRoot, { envName: 'testprod' })];
                case 2:
                    _c.sent();
                    amplifyMeta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    meta = amplifyMeta.providers.awscloudformation;
                    deploymentBucketName1 = meta.DeploymentBucketName;
                    _a = expect;
                    return [4 /*yield*/, bucketExists(deploymentBucketName1)];
                case 3:
                    _a.apply(void 0, [_c.sent()]).toBe(true);
                    return [4 /*yield*/, (0, env_1.checkoutEnvironment)(projRoot, { envName: 'testdev' })];
                case 4:
                    _c.sent();
                    return [4 /*yield*/, (0, env_1.removeEnvironment)(projRoot, { envName: 'testprod' })];
                case 5:
                    _c.sent();
                    _b = expect;
                    return [4 /*yield*/, (0, amplify_e2e_core_1.bucketNotExists)(deploymentBucketName1)];
                case 6:
                    _b.apply(void 0, [_c.sent()]).toBe(true);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.deleteProject)(projRoot)];
                case 7:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should delete bucket', function () { return __awaiter(void 0, void 0, void 0, function () {
        var bucketName, _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, {})];
                case 1:
                    _c.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addAuthWithDefault)(projRoot)];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addS3)(projRoot)];
                case 3:
                    _c.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushWithoutCodegen)(projRoot)];
                case 4:
                    _c.sent();
                    bucketName = (0, amplify_e2e_core_1.getS3StorageBucketName)(projRoot);
                    return [4 /*yield*/, putFiles(bucketName)];
                case 5:
                    _c.sent();
                    _a = expect;
                    return [4 /*yield*/, bucketExists(bucketName)];
                case 6:
                    _a.apply(void 0, [_c.sent()]).toBe(true);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.deleteProject)(projRoot)];
                case 7:
                    _c.sent();
                    _b = expect;
                    return [4 /*yield*/, (0, amplify_e2e_core_1.bucketNotExists)(bucketName)];
                case 8:
                    _b.apply(void 0, [_c.sent()]).toBe(true);
                    return [2 /*return*/];
            }
        });
    }); });
    it('should try deleting unavailable bucket but not fail', function () { return __awaiter(void 0, void 0, void 0, function () {
        var amplifyMeta, meta, bucketName, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, {})];
                case 1:
                    _b.sent();
                    amplifyMeta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    meta = amplifyMeta.providers.awscloudformation;
                    bucketName = meta.DeploymentBucketName;
                    _a = expect;
                    return [4 /*yield*/, bucketExists(bucketName)];
                case 2:
                    _a.apply(void 0, [_b.sent()]).toBe(true);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.deleteS3Bucket)(bucketName)];
                case 3:
                    _b.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.deleteProject)(projRoot)];
                case 4:
                    _b.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
function testDeletion(projRoot, settings) {
    return __awaiter(this, void 0, void 0, function () {
        var amplifyMeta, meta, deploymentBucketName1, AuthRoleName, UnauthRoleName, deploymentBucketName2, _a, _b, _c, _d, _e, _f;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    amplifyMeta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    meta = amplifyMeta.providers.awscloudformation;
                    deploymentBucketName1 = meta.DeploymentBucketName;
                    expect(meta.Region).toBeDefined();
                    AuthRoleName = meta.AuthRoleName, UnauthRoleName = meta.UnauthRoleName;
                    return [4 /*yield*/, (0, env_1.addEnvironment)(projRoot, { envName: 'test' })];
                case 1:
                    _g.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addApiWithoutSchema)(projRoot, { transformerVersion: 1 })];
                case 2:
                    _g.sent();
                    return [4 /*yield*/, (0, add_1.addCodegen)(projRoot, settings)];
                case 3:
                    _g.sent();
                    deploymentBucketName2 = (0, amplify_e2e_core_1.getProjectMeta)(projRoot).providers.awscloudformation.DeploymentBucketName;
                    _a = expect;
                    return [4 /*yield*/, bucketExists(deploymentBucketName1)];
                case 4:
                    _a.apply(void 0, [_g.sent()]).toBe(true);
                    _b = expect;
                    return [4 /*yield*/, bucketExists(deploymentBucketName2)];
                case 5:
                    _b.apply(void 0, [_g.sent()]).toBe(true);
                    if (!meta.AmplifyAppId) return [3 /*break*/, 7];
                    _c = expect;
                    return [4 /*yield*/, appExists(meta.AmplifyAppId, meta.Region)];
                case 6:
                    _c.apply(void 0, [_g.sent()]).toBe(true);
                    _g.label = 7;
                case 7: return [4 /*yield*/, (0, amplify_e2e_core_1.deleteProject)(projRoot)];
                case 8:
                    _g.sent();
                    if (!meta.AmplifyAppId) return [3 /*break*/, 10];
                    _d = expect;
                    return [4 /*yield*/, appExists(meta.AmplifyAppId, meta.Region)];
                case 9:
                    _d.apply(void 0, [_g.sent()]).toBe(false);
                    _g.label = 10;
                case 10:
                    _e = expect;
                    return [4 /*yield*/, (0, amplify_e2e_core_1.bucketNotExists)(deploymentBucketName1)];
                case 11:
                    _e.apply(void 0, [_g.sent()]).toBe(true);
                    _f = expect;
                    return [4 /*yield*/, (0, amplify_e2e_core_1.bucketNotExists)(deploymentBucketName2)];
                case 12:
                    _f.apply(void 0, [_g.sent()]).toBe(true);
                    expect(AuthRoleName).not.toBeIAMRoleWithArn(AuthRoleName);
                    expect(UnauthRoleName).not.toBeIAMRoleWithArn(UnauthRoleName);
                    // check that config/exports file was deleted
                    if (settings.ios) {
                        expect(fs.existsSync((0, amplify_e2e_core_1.getAWSConfigIOSPath)(projRoot))).toBe(false);
                        expect(fs.existsSync((0, amplify_e2e_core_1.getAmplifyConfigIOSPath)(projRoot))).toBe(false);
                    }
                    else if (settings.android) {
                        expect(fs.existsSync((0, amplify_e2e_core_1.getAWSConfigAndroidPath)(projRoot))).toBe(false);
                        expect(fs.existsSync((0, amplify_e2e_core_1.getAmplifyConfigAndroidPath)(projRoot))).toBe(false);
                    }
                    else {
                        expect(fs.existsSync((0, awsExports_1.getAWSExportsPath)(projRoot))).toBe(false);
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function putFiles(bucket, count) {
    if (count === void 0) { count = 1001; }
    return __awaiter(this, void 0, void 0, function () {
        var s3, s3Params;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    s3 = new aws_sdk_1.S3();
                    s3Params = __spreadArray([], Array(count), true).map(function (_, num) { return ({
                        Bucket: bucket,
                        Body: 'dummy body',
                        Key: "".concat(num, ".txt"),
                    }); });
                    return [4 /*yield*/, Promise.all(s3Params.map(function (p) { return s3.putObject(p).promise(); }))];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function bucketExists(bucket) {
    return __awaiter(this, void 0, void 0, function () {
        var s3, params, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    s3 = new aws_sdk_1.S3();
                    params = {
                        Bucket: bucket,
                    };
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, s3.headBucket(params).promise()];
                case 2:
                    _a.sent();
                    return [2 /*return*/, true];
                case 3:
                    error_1 = _a.sent();
                    if (error_1.statusCode === 404) {
                        return [2 /*return*/, false];
                    }
                    throw error_1;
                case 4: return [2 /*return*/];
            }
        });
    });
}
function appExists(appId, region) {
    return __awaiter(this, void 0, void 0, function () {
        var amplify, ex_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    amplify = new aws_sdk_1.Amplify({ region: region });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, amplify.getApp({ appId: appId }).promise()];
                case 2:
                    _a.sent();
                    return [2 /*return*/, true];
                case 3:
                    ex_1 = _a.sent();
                    return [2 /*return*/, false];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function timeout(timeout) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    setTimeout(resolve, timeout);
                })];
        });
    });
}
//# sourceMappingURL=delete.test.js.map