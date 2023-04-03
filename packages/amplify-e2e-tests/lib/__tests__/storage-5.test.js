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
var amplify_cli_core_1 = require("amplify-cli-core");
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
var fs = __importStar(require("fs-extra"));
var path = __importStar(require("path"));
var uuid = __importStar(require("uuid"));
function getServiceMeta(projectRoot, category, service) {
    var meta = (0, amplify_e2e_core_1.getProjectMeta)(projectRoot);
    for (var _i = 0, _a = Object.keys(meta[category]); _i < _a.length; _i++) {
        var storageResourceName = _a[_i];
        if (meta.storage[storageResourceName].service.toUpperCase() === service.toUpperCase()) {
            return meta.storage[storageResourceName];
        }
    }
}
describe('s3 override tests', function () {
    var projRoot;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('s3-overrides')];
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
    it('override S3 Removal property', function () { return __awaiter(void 0, void 0, void 0, function () {
        var projectName, resourcePath, resourceName, destOverrideFilePath, srcInvalidOverrideCompileError, srcInvalidOverrideRuntimeError, srcOverrideFilePath, cfnFilePath, s3CFNFileJSON, s3Meta, _a, bucketName, region, bucketExists;
        var _b, _c, _d, _e, _f, _g, _h, _j;
        return __generator(this, function (_k) {
            switch (_k.label) {
                case 0:
                    projectName = 's3OverrideTest';
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, { name: projectName })];
                case 1:
                    _k.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addAuthWithDefault)(projRoot)];
                case 2:
                    _k.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addS3WithGuestAccess)(projRoot)];
                case 3:
                    _k.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.overrideS3)(projRoot)];
                case 4:
                    _k.sent();
                    resourcePath = path.join(projRoot, 'amplify', 'backend', 'storage');
                    resourceName = fs.readdirSync(resourcePath)[0];
                    destOverrideFilePath = path.join(projRoot, 'amplify', 'backend', 'storage', resourceName, 'override.ts');
                    srcInvalidOverrideCompileError = path.join(__dirname, '..', '..', 'overrides', 'override-compile-error.txt');
                    fs.copyFileSync(srcInvalidOverrideCompileError, destOverrideFilePath);
                    return [4 /*yield*/, expect((0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)).rejects.toThrowError()];
                case 5:
                    _k.sent();
                    srcInvalidOverrideRuntimeError = path.join(__dirname, '..', '..', 'overrides', 'override-runtime-error.txt');
                    fs.copyFileSync(srcInvalidOverrideRuntimeError, destOverrideFilePath);
                    return [4 /*yield*/, expect((0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)).rejects.toThrowError()];
                case 6:
                    _k.sent();
                    srcOverrideFilePath = path.join(__dirname, '..', '..', 'overrides', 'override-storage-s3.ts');
                    cfnFilePath = path.join(projRoot, 'amplify', 'backend', 'storage', resourceName, 'build', 'cloudformation-template.json');
                    (0, amplify_e2e_core_1.replaceOverrideFileWithProjectInfo)(srcOverrideFilePath, destOverrideFilePath, 'integtest', projectName);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.buildOverrideStorage)(projRoot)];
                case 7:
                    _k.sent();
                    s3CFNFileJSON = amplify_cli_core_1.JSONUtilities.readJson(cfnFilePath);
                    // check if overrides are applied to the cfn file
                    expect((_e = (_d = (_c = (_b = s3CFNFileJSON === null || s3CFNFileJSON === void 0 ? void 0 : s3CFNFileJSON.Resources) === null || _b === void 0 ? void 0 : _b.S3Bucket) === null || _c === void 0 ? void 0 : _c.Properties) === null || _d === void 0 ? void 0 : _d.VersioningConfiguration) === null || _e === void 0 ? void 0 : _e.Status).toEqual('Enabled');
                    // check if override persists after an update
                    s3CFNFileJSON = amplify_cli_core_1.JSONUtilities.readJson(cfnFilePath);
                    expect((_j = (_h = (_g = (_f = s3CFNFileJSON === null || s3CFNFileJSON === void 0 ? void 0 : s3CFNFileJSON.Resources) === null || _f === void 0 ? void 0 : _f.S3Bucket) === null || _g === void 0 ? void 0 : _g.Properties) === null || _h === void 0 ? void 0 : _h.VersioningConfiguration) === null || _j === void 0 ? void 0 : _j.Status).toEqual('Enabled');
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                case 8:
                    _k.sent();
                    s3Meta = getServiceMeta(projRoot, 'storage', 'S3');
                    _a = s3Meta.output, bucketName = _a.BucketName, region = _a.Region;
                    expect(region).toBeDefined();
                    expect(bucketName).toBeDefined();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.checkIfBucketExists)(bucketName, region)];
                case 9:
                    bucketExists = _k.sent();
                    expect(bucketExists).toMatchObject({});
                    return [2 /*return*/];
            }
        });
    }); });
});
describe('amplify add/update storage(DDB) with GSI', function () {
    var projRoot;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('ddb-gsi')];
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
    it('init a project add a GSI and then update with another GSI', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, {})];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addAuthWithDefault)(projRoot)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addSimpleDDBwithGSI)(projRoot)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateSimpleDDBwithGSI)(projRoot)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                case 5:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
describe('amplify add/update storage(DDB)', function () {
    var projRoot;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('ddb-add-update')];
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
    it('init a project and add/update ddb table with & without trigger', function () { return __awaiter(void 0, void 0, void 0, function () {
        var meta, _a, table1Name, table1Arn, table1Region, table1StreamArn, table1Configs, _b, table2Name, table2Arn, table2Region, table2StreamArn, table2Configs;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, {})];
                case 1:
                    _c.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addSimpleDDB)(projRoot, {})];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addDDBWithTrigger)(projRoot, {})];
                case 3:
                    _c.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                case 4:
                    _c.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateDDBWithTrigger)(projRoot, {})];
                case 5:
                    _c.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                case 6:
                    _c.sent();
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    _a = Object.keys(meta.storage).map(function (key) { return meta.storage[key]; })[0].output, table1Name = _a.Name, table1Arn = _a.Arn, table1Region = _a.Region, table1StreamArn = _a.StreamArn;
                    expect(table1Name).toBeDefined();
                    expect(table1Arn).toBeDefined();
                    expect(table1Region).toBeDefined();
                    expect(table1StreamArn).toBeDefined();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getDDBTable)(table1Name, table1Region)];
                case 7:
                    table1Configs = _c.sent();
                    expect(table1Configs.Table.TableArn).toEqual(table1Arn);
                    _b = Object.keys(meta.storage).map(function (key) { return meta.storage[key]; })[1].output, table2Name = _b.Name, table2Arn = _b.Arn, table2Region = _b.Region, table2StreamArn = _b.StreamArn;
                    expect(table2Name).toBeDefined();
                    expect(table2Arn).toBeDefined();
                    expect(table2Region).toBeDefined();
                    expect(table2StreamArn).toBeDefined();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getDDBTable)(table2Name, table2Region)];
                case 8:
                    table2Configs = _c.sent();
                    expect(table2Configs.Table.TableArn).toEqual(table2Arn);
                    return [2 /*return*/];
            }
        });
    }); });
});
describe('ddb override tests', function () {
    var projRoot;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('ddb-overrides')];
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
    it('override DDB StreamSpecification property', function () { return __awaiter(void 0, void 0, void 0, function () {
        var resourceName, projectName, destOverrideFilePath, srcInvalidOverrideCompileError, srcInvalidOverrideRuntimeError, srcOverrideFilePath, cfnFilePath, ddbCFNFileJSON, meta, _a, table1Name, table1Arn, table1Region, table1StreamArn, table1Configs;
        var _b, _c, _d, _e, _f, _g, _h, _j;
        return __generator(this, function (_k) {
            switch (_k.label) {
                case 0:
                    resourceName = "dynamo".concat(uuid.v4().split('-')[0]);
                    projectName = 'ddbOverrideTest';
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, { name: projectName })];
                case 1:
                    _k.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addSimpleDDB)(projRoot, { name: resourceName })];
                case 2:
                    _k.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.overrideDDB)(projRoot)];
                case 3:
                    _k.sent();
                    destOverrideFilePath = path.join(projRoot, 'amplify', 'backend', 'storage', resourceName, 'override.ts');
                    srcInvalidOverrideCompileError = path.join(__dirname, '..', '..', 'overrides', 'override-compile-error.txt');
                    fs.copyFileSync(srcInvalidOverrideCompileError, destOverrideFilePath);
                    return [4 /*yield*/, expect((0, amplify_e2e_core_1.buildOverrideStorage)(projRoot)).rejects.toThrowError()];
                case 4:
                    _k.sent();
                    return [4 /*yield*/, expect((0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)).rejects.toThrowError()];
                case 5:
                    _k.sent();
                    srcInvalidOverrideRuntimeError = path.join(__dirname, '..', '..', 'overrides', 'override-runtime-error.txt');
                    fs.copyFileSync(srcInvalidOverrideRuntimeError, destOverrideFilePath);
                    return [4 /*yield*/, expect((0, amplify_e2e_core_1.buildOverrideStorage)(projRoot)).rejects.toThrowError()];
                case 6:
                    _k.sent();
                    return [4 /*yield*/, expect((0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)).rejects.toThrowError()];
                case 7:
                    _k.sent();
                    srcOverrideFilePath = path.join(__dirname, '..', '..', 'overrides', 'override-storage-ddb.ts');
                    cfnFilePath = path.join(projRoot, 'amplify', 'backend', 'storage', resourceName, 'build', "".concat(resourceName, "-cloudformation-template.json"));
                    (0, amplify_e2e_core_1.replaceOverrideFileWithProjectInfo)(srcOverrideFilePath, destOverrideFilePath, 'integtest', projectName);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.buildOverrideStorage)(projRoot)];
                case 8:
                    _k.sent();
                    ddbCFNFileJSON = amplify_cli_core_1.JSONUtilities.readJson(cfnFilePath);
                    // check if overrides are applied to the cfn file
                    expect((_e = (_d = (_c = (_b = ddbCFNFileJSON === null || ddbCFNFileJSON === void 0 ? void 0 : ddbCFNFileJSON.Resources) === null || _b === void 0 ? void 0 : _b.DynamoDBTable) === null || _c === void 0 ? void 0 : _c.Properties) === null || _d === void 0 ? void 0 : _d.StreamSpecification) === null || _e === void 0 ? void 0 : _e.StreamViewType).toEqual('NEW_AND_OLD_IMAGES');
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateDDBWithTrigger)(projRoot, {})];
                case 9:
                    _k.sent();
                    // check if override persists after an update
                    ddbCFNFileJSON = amplify_cli_core_1.JSONUtilities.readJson(cfnFilePath);
                    expect((_j = (_h = (_g = (_f = ddbCFNFileJSON === null || ddbCFNFileJSON === void 0 ? void 0 : ddbCFNFileJSON.Resources) === null || _f === void 0 ? void 0 : _f.DynamoDBTable) === null || _g === void 0 ? void 0 : _g.Properties) === null || _h === void 0 ? void 0 : _h.StreamSpecification) === null || _j === void 0 ? void 0 : _j.StreamViewType).toEqual('NEW_AND_OLD_IMAGES');
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                case 10:
                    _k.sent();
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    _a = Object.keys(meta.storage).map(function (key) { return meta.storage[key]; })[0].output, table1Name = _a.Name, table1Arn = _a.Arn, table1Region = _a.Region, table1StreamArn = _a.StreamArn;
                    expect(table1Name).toBeDefined();
                    expect(table1Arn).toBeDefined();
                    expect(table1Region).toBeDefined();
                    expect(table1StreamArn).toBeDefined();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getDDBTable)(table1Name, table1Region)];
                case 11:
                    table1Configs = _k.sent();
                    expect(table1Configs.Table.TableArn).toEqual(table1Arn);
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=storage-5.test.js.map