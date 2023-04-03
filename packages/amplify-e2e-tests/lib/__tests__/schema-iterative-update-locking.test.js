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
var path = __importStar(require("path"));
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
var s3_1 = __importDefault(require("aws-sdk/clients/s3"));
var amplify_cli_core_1 = require("amplify-cli-core");
describe('Schema iterative update - locking', function () {
    var projectRoot;
    beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('schemaIterativeLock')];
                case 1:
                    projectRoot = _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projectRoot, {
                            name: 'iterlock',
                            disableAmplifyAppCreation: false,
                        })];
                case 2:
                    _a.sent();
                    (0, amplify_e2e_core_1.addFeatureFlag)(projectRoot, 'graphqltransformer', 'enableiterativegsiupdates', true);
                    return [2 /*return*/];
            }
        });
    }); });
    afterAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.deleteProject)(projectRoot)];
                case 1:
                    _a.sent();
                    (0, amplify_e2e_core_1.deleteProjectDir)(projectRoot);
                    return [2 /*return*/];
            }
        });
    }); });
    it('other push should fail due to locking', function () { return __awaiter(void 0, void 0, void 0, function () {
        var apiName, initialSchema, finalSchema, appId, projectRootPull, firstPush, meta, projectRegion, deploymentBucketName, s3, lockFileExists, retry, maxRetries, retryDelay, stateFileName, deploymentStateObject, deploymentState, _a, secondPush;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    apiName = 'iterlock';
                    initialSchema = path.join('iterative-push', 'change-model-name', 'initial-schema.graphql');
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addApiWithoutSchema)(projectRoot, { apiKeyExpirationDays: 7, transformerVersion: 1 })];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateApiSchema)(projectRoot, apiName, initialSchema)];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPush)(projectRoot)];
                case 3:
                    _b.sent();
                    finalSchema = path.join('iterative-push', 'change-model-name', 'final-schema.graphql');
                    (0, amplify_e2e_core_1.updateApiSchema)(projectRoot, apiName, finalSchema);
                    appId = (0, amplify_e2e_core_1.getAppId)(projectRoot);
                    expect(appId).toBeDefined();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('iterlock-pull')];
                case 4:
                    projectRootPull = _b.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPull)(projectRootPull, { override: false, emptyDir: true, appId: appId })];
                case 5:
                    _b.sent();
                    // Apply modifications to second projects
                    (0, amplify_e2e_core_1.updateApiSchema)(projectRootPull, apiName, finalSchema);
                    firstPush = (0, amplify_e2e_core_1.amplifyPushUpdate)(projectRoot);
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projectRoot);
                    projectRegion = meta.providers.awscloudformation.Region;
                    deploymentBucketName = meta.providers.awscloudformation.DeploymentBucketName;
                    s3 = new s3_1.default({
                        region: projectRegion,
                    });
                    lockFileExists = false;
                    retry = 0;
                    maxRetries = 3;
                    retryDelay = 3000;
                    stateFileName = 'deployment-state.json';
                    _b.label = 6;
                case 6:
                    if (!(retry < maxRetries || !lockFileExists)) return [3 /*break*/, 14];
                    _b.label = 7;
                case 7:
                    _b.trys.push([7, 12, , 13]);
                    return [4 /*yield*/, s3
                            .getObject({
                            Bucket: deploymentBucketName,
                            Key: stateFileName,
                        })
                            .promise()];
                case 8:
                    deploymentStateObject = _b.sent();
                    deploymentState = amplify_cli_core_1.JSONUtilities.parse(deploymentStateObject.Body.toString());
                    if (!(deploymentState.status === amplify_cli_core_1.DeploymentStatus.DEPLOYING)) return [3 /*break*/, 9];
                    lockFileExists = true;
                    return [3 /*break*/, 14];
                case 9:
                    retry++;
                    return [4 /*yield*/, (0, amplify_e2e_core_1.sleep)(retryDelay)];
                case 10:
                    _b.sent();
                    _b.label = 11;
                case 11: return [3 /*break*/, 13];
                case 12:
                    _a = _b.sent();
                    return [3 /*break*/, 13];
                case 13: return [3 /*break*/, 6];
                case 14:
                    expect(lockFileExists).toBe(true);
                    secondPush = (0, amplify_e2e_core_1.amplifyPushUpdate)(projectRootPull, /A deployment is in progress.*/);
                    return [4 /*yield*/, Promise.all([firstPush, secondPush])];
                case 15:
                    _b.sent();
                    (0, amplify_e2e_core_1.deleteProjectDir)(projectRootPull);
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=schema-iterative-update-locking.test.js.map