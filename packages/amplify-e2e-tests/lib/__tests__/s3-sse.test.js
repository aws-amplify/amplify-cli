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
describe('amplify always enables SSE on S3 buckets', function () {
    var projRoot;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('s3-test')];
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
    it('enables SSE on the deployment, category and hosting buckets', function () { return __awaiter(void 0, void 0, void 0, function () {
        var meta, deploymentBucket, hostingBucket, categoryBucket;
        var _a, _b, _c, _d, _e, _f, _g, _h;
        return __generator(this, function (_j) {
            switch (_j.label) {
                case 0: 
                // setup
                return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, {})];
                case 1:
                    // setup
                    _j.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addAuthWithDefault)(projRoot)];
                case 2:
                    _j.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addS3)(projRoot)];
                case 3:
                    _j.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addDEVHosting)(projRoot)];
                case 4:
                    _j.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                case 5:
                    _j.sent();
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    deploymentBucket = (_b = (_a = meta === null || meta === void 0 ? void 0 : meta.providers) === null || _a === void 0 ? void 0 : _a.awscloudformation) === null || _b === void 0 ? void 0 : _b.DeploymentBucketName;
                    hostingBucket = (_e = (_d = (_c = Object.values(meta === null || meta === void 0 ? void 0 : meta.hosting)) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.output) === null || _e === void 0 ? void 0 : _e.HostingBucketName;
                    categoryBucket = (_h = (_g = (_f = Object.values(meta === null || meta === void 0 ? void 0 : meta.storage)) === null || _f === void 0 ? void 0 : _f[0]) === null || _g === void 0 ? void 0 : _g.output) === null || _h === void 0 ? void 0 : _h.BucketName;
                    return [4 /*yield*/, expectSSEEnabledForBucket(deploymentBucket)];
                case 6:
                    _j.sent();
                    return [4 /*yield*/, expectSSEEnabledForBucket(hostingBucket)];
                case 7:
                    _j.sent();
                    return [4 /*yield*/, expectSSEEnabledForBucket(categoryBucket)];
                case 8:
                    _j.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
var expectSSEEnabledForBucket = function (bucket) { return __awaiter(void 0, void 0, void 0, function () {
    var result;
    var _a, _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                expect(bucket).toBeDefined();
                return [4 /*yield*/, (0, amplify_e2e_core_1.getBucketEncryption)(bucket)];
            case 1:
                result = _d.sent();
                expect((_c = (_b = (_a = result === null || result === void 0 ? void 0 : result.Rules) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.ApplyServerSideEncryptionByDefault) === null || _c === void 0 ? void 0 : _c.SSEAlgorithm).toBe('AES256');
                return [2 /*return*/];
        }
    });
}); };
//# sourceMappingURL=s3-sse.test.js.map