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
var aws_sdk_1 = require("aws-sdk");
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
var fs = __importStar(require("fs-extra"));
var path = __importStar(require("path"));
describe('amplify add hosting', function () {
    var projRoot;
    beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createReactTestProject)()];
                case 1:
                    projRoot = _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, {})];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addPRODHosting)(projRoot)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushWithoutCodegen)(projRoot)];
                case 4:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    afterAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        var projectMeta, hostingBucket;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    projectMeta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    hostingBucket = (_c = (_b = (_a = projectMeta === null || projectMeta === void 0 ? void 0 : projectMeta.hosting) === null || _a === void 0 ? void 0 : _a.S3AndCloudFront) === null || _b === void 0 ? void 0 : _b.output) === null || _c === void 0 ? void 0 : _c.HostingBucketName;
                    return [4 /*yield*/, (0, amplify_e2e_core_1.removeHosting)(projRoot)];
                case 1:
                    _d.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushWithoutCodegen)(projRoot)];
                case 2:
                    _d.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.deleteProject)(projRoot)];
                case 3:
                    _d.sent();
                    if (!hostingBucket) return [3 /*break*/, 5];
                    // Once the Hosting bucket is removed automatically we should get rid of this.
                    return [4 /*yield*/, (0, amplify_e2e_core_1.deleteS3Bucket)(hostingBucket)];
                case 4:
                    // Once the Hosting bucket is removed automatically we should get rid of this.
                    _d.sent();
                    _d.label = 5;
                case 5:
                    (0, amplify_e2e_core_1.deleteProjectDir)(projRoot);
                    return [2 /*return*/];
            }
        });
    }); });
    it('push creates correct amplify artifacts', function () { return __awaiter(void 0, void 0, void 0, function () {
        var projectMeta, cloudFrontDistribution;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    expect(fs.existsSync(path.join(projRoot, 'amplify', 'backend', 'hosting', 'S3AndCloudFront'))).toBe(true);
                    projectMeta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    expect(projectMeta.hosting).toBeDefined();
                    expect(projectMeta.hosting.S3AndCloudFront).toBeDefined();
                    expect(projectMeta.hosting.S3AndCloudFront.output.CloudFrontDistributionID).toBeDefined();
                    return [4 /*yield*/, getCloudFrontDistribution(projectMeta.hosting.S3AndCloudFront.output.CloudFrontDistributionID)];
                case 1:
                    cloudFrontDistribution = _a.sent();
                    expect(cloudFrontDistribution.DistributionConfig.HttpVersion).toEqual('http2');
                    return [2 /*return*/];
            }
        });
    }); });
    it('publish successfully', function () { return __awaiter(void 0, void 0, void 0, function () {
        var error, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    // root stack updated
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPublishWithoutUpdate)(projRoot)];
                case 1:
                    // root stack updated
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    err_1 = _a.sent();
                    error = err_1;
                    return [3 /*break*/, 3];
                case 3:
                    expect(error).not.toBeDefined();
                    return [2 /*return*/];
            }
        });
    }); });
    it('publish throws error if build command is missing', function () { return __awaiter(void 0, void 0, void 0, function () {
        var currentBuildCommand, error, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    currentBuildCommand = (0, amplify_e2e_core_1.resetBuildCommand)(projRoot, '');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPublishWithoutUpdate)(projRoot)];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_2 = _a.sent();
                    error = err_2;
                    return [3 /*break*/, 4];
                case 4:
                    expect(error).toBeDefined();
                    expect(error.message).toEqual('Process exited with non zero exit code 1');
                    (0, amplify_e2e_core_1.resetBuildCommand)(projRoot, currentBuildCommand);
                    return [2 /*return*/];
            }
        });
    }); });
    it('correctly updates hosting meta output after CloudFront is removed', function () { return __awaiter(void 0, void 0, void 0, function () {
        var projectMeta;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.removePRODCloudFront)(projRoot)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushWithoutCodegen)(projRoot)];
                case 2:
                    _a.sent();
                    expect(fs.existsSync(path.join(projRoot, 'amplify', 'backend', 'hosting', 'S3AndCloudFront'))).toBe(true);
                    projectMeta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    expect(projectMeta.hosting).toBeDefined();
                    expect(projectMeta.hosting.S3AndCloudFront).toBeDefined();
                    expect(projectMeta.hosting.S3AndCloudFront.output.CloudFrontSecureURL).not.toBeDefined();
                    expect(projectMeta.hosting.S3AndCloudFront.output.CloudFrontOriginAccessIdentity).not.toBeDefined();
                    expect(projectMeta.hosting.S3AndCloudFront.output.CloudFrontDistributionID).not.toBeDefined();
                    expect(projectMeta.hosting.S3AndCloudFront.output.CloudFrontDomainName).not.toBeDefined();
                    expect(projectMeta.hosting.S3AndCloudFront.output.WebsiteURL).toBeDefined();
                    return [2 /*return*/];
            }
        });
    }); });
});
function getCloudFrontDistribution(cloudFrontDistributionID) {
    return __awaiter(this, void 0, void 0, function () {
        var cloudFrontClient, getDistributionResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    cloudFrontClient = new aws_sdk_1.CloudFront();
                    return [4 /*yield*/, cloudFrontClient
                            .getDistribution({
                            Id: cloudFrontDistributionID,
                        })
                            .promise()];
                case 1:
                    getDistributionResult = _a.sent();
                    return [2 /*return*/, getDistributionResult.Distribution];
            }
        });
    });
}
//# sourceMappingURL=hostingPROD.test.js.map