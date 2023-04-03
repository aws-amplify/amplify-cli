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
var uuid_1 = require("uuid");
describe('adding custom resources test', function () {
    var projRoot;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('custom-resources')];
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
    it('add/update CDK and CFN custom resources', function () { return __awaiter(void 0, void 0, void 0, function () {
        var cdkResourceName, cfnResourceName, destCustomResourceFilePath, cfnFilePath, srcCompileErrorTest, srcRuntimeErrorTest, ddbName, srcCustomResourceFilePath, buildCFNFileJSON, meta, customResourceSNSArn, customCFNFilePath, customCFNFileJSON;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    cdkResourceName = "custom".concat((0, uuid_1.v4)().split('-')[0]);
                    cfnResourceName = "custom".concat((0, uuid_1.v4)().split('-')[0]);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, {})];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addCDKCustomResource)(projRoot, { name: cdkResourceName })];
                case 2:
                    _b.sent();
                    destCustomResourceFilePath = path.join(projRoot, 'amplify', 'backend', 'custom', cdkResourceName, 'cdk-stack.ts');
                    cfnFilePath = path.join(projRoot, 'amplify', 'backend', 'custom', cdkResourceName, 'build', "".concat(cdkResourceName, "-cloudformation-template.json"));
                    srcCompileErrorTest = path.join(__dirname, '..', '..', 'custom-resources', 'custom-cdk-stack-compile-error.txt');
                    fs.copyFileSync(srcCompileErrorTest, destCustomResourceFilePath);
                    return [4 /*yield*/, expect((0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)).rejects.toThrowError()];
                case 3:
                    _b.sent();
                    srcRuntimeErrorTest = path.join(__dirname, '..', '..', 'custom-resources', 'custom-cdk-stack-runtime-error.txt');
                    fs.copyFileSync(srcRuntimeErrorTest, destCustomResourceFilePath);
                    return [4 /*yield*/, expect((0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)).rejects.toThrowError()];
                case 4:
                    _b.sent();
                    ddbName = 'ddb';
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addSimpleDDB)(projRoot, { name: ddbName })];
                case 5:
                    _b.sent();
                    srcCustomResourceFilePath = path.join(__dirname, '..', '..', 'custom-resources', 'custom-cdk-stack.ts');
                    fs.copyFileSync(srcCustomResourceFilePath, destCustomResourceFilePath);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.buildCustomResources)(projRoot)];
                case 6:
                    _b.sent();
                    if (!!(0, amplify_cli_core_1.isWindowsPlatform)()) return [3 /*break*/, 8];
                    (0, amplify_e2e_core_1.useLatestExtensibilityHelper)(projRoot, cdkResourceName);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.buildCustomResources)(projRoot)];
                case 7:
                    _b.sent();
                    _b.label = 8;
                case 8: return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                case 9:
                    _b.sent();
                    // check if cfn file is generated in the build dir
                    expect(fs.existsSync(cfnFilePath)).toEqual(true);
                    buildCFNFileJSON = amplify_cli_core_1.JSONUtilities.readJson(cfnFilePath);
                    // Basic sanity generated CFN file content check
                    expect(buildCFNFileJSON === null || buildCFNFileJSON === void 0 ? void 0 : buildCFNFileJSON.Parameters).toMatchSnapshot();
                    expect(buildCFNFileJSON === null || buildCFNFileJSON === void 0 ? void 0 : buildCFNFileJSON.Parameters).toMatchObject({
                        env: { Type: 'String', Description: 'Current Amplify CLI env name' },
                        storageddbName: { Type: 'String' },
                    });
                    expect(Object.keys(buildCFNFileJSON === null || buildCFNFileJSON === void 0 ? void 0 : buildCFNFileJSON.Outputs)).toEqual(['snsTopicArn']);
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    customResourceSNSArn = Object.keys(meta.custom).map(function (key) { return meta.custom[key]; })[0].output.snsTopicArn;
                    expect(customResourceSNSArn).toBeDefined();
                    // Add custom CFN and add dependency of custom CDK resource on the custom CFN
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addCFNCustomResource)(projRoot, { name: cfnResourceName, promptForCategorySelection: true })];
                case 10:
                    // Add custom CFN and add dependency of custom CDK resource on the custom CFN
                    _b.sent();
                    customCFNFilePath = path.join(projRoot, 'amplify', 'backend', 'custom', cfnResourceName, "".concat(cfnResourceName, "-cloudformation-template.json"));
                    customCFNFileJSON = amplify_cli_core_1.JSONUtilities.readJson(customCFNFilePath);
                    expect(buildCFNFileJSON === null || buildCFNFileJSON === void 0 ? void 0 : buildCFNFileJSON.Parameters).toMatchSnapshot();
                    // Make sure input params has params from the resource dependency
                    expect(customCFNFileJSON === null || customCFNFileJSON === void 0 ? void 0 : customCFNFileJSON.Parameters).toMatchObject((_a = {
                            env: { Type: 'String' }
                        },
                        _a["custom".concat(cdkResourceName, "snsTopicArn")] = {
                            Type: 'String',
                            Description: "Input parameter describing snsTopicArn attribute for custom/".concat(cdkResourceName, " resource"),
                        },
                        _a));
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=custom_resources.test.js.map