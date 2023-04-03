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
Object.defineProperty(exports, "__esModule", { value: true });
var aws = __importStar(require("aws-sdk"));
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
var import_helpers_1 = require("../import-helpers");
var profileName = 'amplify-integ-test-user';
describe('headless s3 import', function () {
    var projectPrefix = 'sssheadimp';
    var bucketPrefix = 'sss-headless-import-';
    var projectSettings = {
        name: projectPrefix,
    };
    var projectRoot;
    var ignoreProjectDeleteErrors = false;
    var bucketNameToImport;
    var bucketLocation;
    beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        var shortId, credentials, s3, locationResponse;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    shortId = (0, import_helpers_1.getShortId)();
                    bucketNameToImport = "".concat(bucketPrefix).concat(shortId);
                    credentials = new aws.SharedIniFileCredentials({ profile: profileName });
                    aws.config.credentials = credentials;
                    s3 = new aws.S3();
                    return [4 /*yield*/, s3
                            .createBucket({
                            Bucket: bucketNameToImport,
                        })
                            .promise()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, s3
                            .getBucketLocation({
                            Bucket: bucketNameToImport,
                        })
                            .promise()];
                case 2:
                    locationResponse = _a.sent();
                    // For us-east-1 buckets the LocationConstraint is always emtpy, we have to return a
                    // region in every case.
                    // https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketLocation.html
                    if (locationResponse.LocationConstraint === undefined ||
                        locationResponse.LocationConstraint === '' ||
                        locationResponse.LocationConstraint === null) {
                        bucketLocation = 'us-east-1';
                    }
                    else {
                        bucketLocation = locationResponse.LocationConstraint;
                    }
                    return [2 /*return*/];
            }
        });
    }); });
    afterAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        var s3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    s3 = new aws.S3();
                    return [4 /*yield*/, s3
                            .deleteBucket({
                            Bucket: bucketNameToImport,
                        })
                            .promise()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)(projectPrefix)];
                case 1:
                    projectRoot = _a.sent();
                    ignoreProjectDeleteErrors = false;
                    return [2 /*return*/];
            }
        });
    }); });
    afterEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.deleteProject)(projectRoot)];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    // In some tests where project initialization fails it can lead to errors on cleanup which we
                    // can ignore if set by the test
                    if (!ignoreProjectDeleteErrors) {
                        throw error_1;
                    }
                    return [3 /*break*/, 3];
                case 3:
                    (0, amplify_e2e_core_1.deleteProjectDir)(projectRoot);
                    return [2 /*return*/];
            }
        });
    }); });
    it('import storage when no auth resource is in the project', function () { return __awaiter(void 0, void 0, void 0, function () {
        var processResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projectRoot, projectSettings)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.importHeadlessStorage)(projectRoot, {
                            version: 1,
                            serviceConfiguration: {
                                serviceName: 'S3',
                                bucketName: bucketNameToImport,
                            },
                        }, false)];
                case 2:
                    processResult = _a.sent();
                    expect(processResult.exitCode).toBe(1);
                    expect(processResult.stderr).toContain('Cannot headlessly import storage resource without an existing auth resource. It can be added with \\"amplify add auth\\"');
                    return [2 /*return*/];
            }
        });
    }); });
    it('import storage when there is already a storage resource in the project', function () { return __awaiter(void 0, void 0, void 0, function () {
        var processResult, processResultFail;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projectRoot, projectSettings)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addAuthWithDefault)(projectRoot)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.importHeadlessStorage)(projectRoot, {
                            version: 1,
                            serviceConfiguration: {
                                serviceName: 'S3',
                                bucketName: bucketNameToImport,
                            },
                        }, false)];
                case 3:
                    processResult = _a.sent();
                    expect(processResult.exitCode).toBe(0);
                    expect(processResult.stdout).toEqual('');
                    return [4 /*yield*/, (0, amplify_e2e_core_1.importHeadlessStorage)(projectRoot, {
                            version: 1,
                            serviceConfiguration: {
                                serviceName: 'S3',
                                bucketName: bucketNameToImport,
                            },
                        }, false)];
                case 4:
                    processResultFail = _a.sent();
                    expect(processResultFail.exitCode).toBe(1);
                    expect(processResultFail.stderr).toContain('Amazon S3 storage was already added to your project');
                    return [2 /*return*/];
            }
        });
    }); });
    it('import storage with non-existent bucket`', function () { return __awaiter(void 0, void 0, void 0, function () {
        var fakeBucketName, processResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projectRoot, projectSettings)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addAuthWithDefault)(projectRoot)];
                case 2:
                    _a.sent();
                    fakeBucketName = "fake-bucket-name-".concat((0, import_helpers_1.getShortId)());
                    return [4 /*yield*/, (0, amplify_e2e_core_1.importHeadlessStorage)(projectRoot, {
                            version: 1,
                            serviceConfiguration: {
                                serviceName: 'S3',
                                bucketName: fakeBucketName,
                            },
                        }, false)];
                case 3:
                    processResult = _a.sent();
                    expect(processResult.exitCode).toBe(1);
                    expect(processResult.stderr).toContain("The specified bucket: \\\"".concat(fakeBucketName, "\\\" does not exist."));
                    return [2 /*return*/];
            }
        });
    }); });
    it('import storage successfully and push, remove storage and push`', function () { return __awaiter(void 0, void 0, void 0, function () {
        var processResult, storageResourceName, projectDetails;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projectRoot, projectSettings)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addAuthWithDefault)(projectRoot)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.importHeadlessStorage)(projectRoot, {
                            version: 1,
                            serviceConfiguration: {
                                serviceName: 'S3',
                                bucketName: bucketNameToImport,
                            },
                        })];
                case 3:
                    processResult = _a.sent();
                    expect(processResult.exitCode).toBe(0);
                    expect(processResult.stdout).toEqual('');
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyStatus)(projectRoot, 'Import')];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projectRoot)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyStatus)(projectRoot, 'No Change')];
                case 6:
                    _a.sent();
                    storageResourceName = (0, import_helpers_1.getS3ResourceName)(projectRoot);
                    (0, import_helpers_1.expectLocalAndCloudMetaFilesMatching)(projectRoot);
                    projectDetails = (0, import_helpers_1.getStorageProjectDetails)(projectRoot);
                    expect(projectDetails.meta.BucketName).toEqual(bucketNameToImport);
                    expect(projectDetails.meta.Region).toEqual(bucketLocation);
                    expect(projectDetails.team.bucketName).toEqual(bucketNameToImport);
                    expect(projectDetails.team.region).toEqual(bucketLocation);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.removeHeadlessStorage)(projectRoot, {
                            version: 1,
                            serviceConfiguration: {
                                serviceName: 'S3',
                                resourceName: storageResourceName,
                                // deleteBucketAndContents: true,
                            },
                        })];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyStatus)(projectRoot, 'Unlink')];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projectRoot)];
                case 9:
                    _a.sent();
                    (0, import_helpers_1.expectNoStorageInMeta)(projectRoot);
                    (0, import_helpers_1.expectLocalTeamInfoHasOnlyAuthCategoryAndNoStorage)(projectRoot);
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=import_s3_3.test.js.map