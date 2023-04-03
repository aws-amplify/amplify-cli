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
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
var fs = __importStar(require("fs-extra"));
var path = __importStar(require("path"));
var glob_1 = __importDefault(require("glob"));
var extract_zip_1 = __importDefault(require("extract-zip"));
var PARAMETERS_JSON = 'parameters.json';
var BUILD = 'build';
var CLI_INPUTS_JSON = 'cli-inputs.json';
var SCHEMA_GRAPHQL = 'schema.graphql';
var AWSCLOUDFORMATION = 'awscloudformation';
var ROOT_CLOUDFORMATION_STACK_JSON = 'root-cloudformation-stack.json';
var CLI_JSON = 'cli.json';
var CLOUDFORMATION_TEMPLATE_JSON = 'cloudformation-template.json';
var BACKEND = 'backend';
var BACKEND_CONFIG_JSON = 'backend-config.json';
var AMPLIFY = 'amplify';
var defaultsSettings = {};
describe('amplify diagnose --send-report', function () {
    var projectRoot;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('diagnoseTest')];
                case 1:
                    projectRoot = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    afterEach(function () { return __awaiter(void 0, void 0, void 0, function () {
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
    it('...should send zips and verify files', function () { return __awaiter(void 0, void 0, void 0, function () {
        var pathToZip, unzippedDir, filesInZip, backend, resources, files, amplifyBackendUnzipped, backendFConfigFilePath;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projectRoot, defaultsSettings)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addApiWithoutSchema)(projectRoot, { transformerVersion: 2 })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addAuthWithDefault)(projectRoot)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addS3StorageWithAuthOnly)(projectRoot)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.diagnoseSendReport)(projectRoot)];
                case 5:
                    pathToZip = _a.sent();
                    expect(fs.existsSync(pathToZip)).toBeTruthy();
                    unzippedDir = path.join(path.dirname(pathToZip), 'unzipped');
                    return [4 /*yield*/, unzipAndReturnFiles(pathToZip, unzippedDir)];
                case 6:
                    filesInZip = _a.sent();
                    backend = (0, amplify_e2e_core_1.getBackendConfig)(projectRoot);
                    resources = [];
                    Object.keys(backend).reduce(function (array, key) {
                        Object.keys(backend[key]).forEach(function (resourceKey) {
                            array.push({
                                category: key,
                                resourceName: resourceKey,
                                service: backend[key][resourceKey].service,
                            });
                        });
                        return array;
                    }, resources);
                    files = [];
                    amplifyBackendUnzipped = path.join(unzippedDir, AMPLIFY, BACKEND);
                    resources.forEach(function (r) {
                        var categoryUnzippedPath = path.join(amplifyBackendUnzipped, r.category, r.resourceName);
                        if (r.category === 'api') {
                            files.push(path.join(categoryUnzippedPath, BUILD, CLOUDFORMATION_TEMPLATE_JSON));
                            files.push(path.join(categoryUnzippedPath, BUILD, PARAMETERS_JSON));
                            files.push(path.join(categoryUnzippedPath, CLI_INPUTS_JSON));
                            files.push(path.join(categoryUnzippedPath, PARAMETERS_JSON));
                            files.push(path.join(categoryUnzippedPath, SCHEMA_GRAPHQL));
                        }
                        if (r.category === 'auth') {
                            files.push(path.join(categoryUnzippedPath, BUILD, "".concat(r.resourceName, "-").concat(CLOUDFORMATION_TEMPLATE_JSON)));
                            files.push(path.join(categoryUnzippedPath, BUILD, PARAMETERS_JSON));
                            files.push(path.join(categoryUnzippedPath, CLI_INPUTS_JSON));
                        }
                        if (r.category === 'storage') {
                            files.push(path.join(categoryUnzippedPath, BUILD, CLOUDFORMATION_TEMPLATE_JSON));
                            files.push(path.join(categoryUnzippedPath, BUILD, PARAMETERS_JSON));
                            files.push(path.join(categoryUnzippedPath, CLI_INPUTS_JSON));
                        }
                    });
                    files.push(path.join(amplifyBackendUnzipped, AWSCLOUDFORMATION, BUILD, ROOT_CLOUDFORMATION_STACK_JSON));
                    files.push(path.join(amplifyBackendUnzipped, BACKEND_CONFIG_JSON));
                    files.push(path.join(unzippedDir, AMPLIFY, CLI_JSON));
                    expect(files.sort()).toEqual(filesInZip);
                    fs.removeSync(unzippedDir);
                    fs.unlinkSync(pathToZip);
                    backendFConfigFilePath = path.join(projectRoot, 'amplify', 'backend', 'backend-config.json');
                    fs.unlinkSync(backendFConfigFilePath);
                    (0, amplify_e2e_core_1.diagnoseSendReport_ZipFailed)(projectRoot);
                    return [2 /*return*/];
            }
        });
    }); });
});
var unzipAndReturnFiles = function (zipPath, unzippedDir) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                fs.ensureDirSync(unzippedDir);
                return [4 /*yield*/, (0, extract_zip_1.default)(zipPath, { dir: unzippedDir })];
            case 1:
                _a.sent();
                console.log(unzippedDir);
                return [2 /*return*/, glob_1.default
                        .sync('**/*.*', {
                        cwd: unzippedDir,
                        absolute: true,
                    })
                        .sort()];
        }
    });
}); };
//# sourceMappingURL=diagnose.test.js.map