"use strict";
/* eslint-disable spellcheck/spell-checker */
/* eslint-disable import/no-extraneous-dependencies */
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
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
var path = __importStar(require("path"));
var fs = __importStar(require("fs-extra"));
var _ = __importStar(require("lodash"));
describe('amplify export pull c', function () {
    var projRoot;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('exporttest')];
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
    it('init an android project and compare with export pull', function () { return __awaiter(void 0, void 0, void 0, function () {
        var awsConfigPath, amplifyConfigPath, pullConfigPath;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initAndroidProjectWithProfile)(projRoot, { envName: 'dev' })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, AddandPushCategories('android')];
                case 2:
                    _a.sent();
                    awsConfigPath = (0, amplify_e2e_core_1.getAWSConfigAndroidPath)(projRoot);
                    amplifyConfigPath = (0, amplify_e2e_core_1.getAmplifyConfigAndroidPath)(projRoot);
                    return [4 /*yield*/, generatePullConfig('android')];
                case 3:
                    pullConfigPath = _a.sent();
                    compareFileContents(awsConfigPath, path.join(pullConfigPath, path.basename(awsConfigPath)));
                    compareFileContents(amplifyConfigPath, path.join(pullConfigPath, path.basename(amplifyConfigPath)));
                    return [2 /*return*/];
            }
        });
    }); });
    var compareFileContents = function (path1, path2) {
        var fileString1 = fs.readFileSync(path1, 'utf-8');
        var fileString2 = fs.readFileSync(path2, 'utf-8');
        var object1 = JSON.parse(fileString1.substring(fileString1.indexOf('{'), fileString1.lastIndexOf('}') + 1));
        var object2 = JSON.parse(fileString2.substring(fileString2.indexOf('{'), fileString2.lastIndexOf('}') + 1));
        expect(recursiveComapre(object1, object2)).toBeTruthy();
    };
    var recursiveComapre = function (object1, object2) {
        return Object.keys(object1).reduce(function (equal, key) {
            if (!equal)
                return false;
            if (typeof object1[key] !== 'object') {
                return object1[key] === object2[key];
            }
            return recursiveComapre(object1[key], object2[key]);
        }, true);
    };
    var AddandPushCategories = function (frontend) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.addAuthWithMaxOptions)(projRoot, { frontend: frontend })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addApiWithoutSchema)(projRoot, { transformerVersion: 1 })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addDEVHosting)(projRoot)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addS3StorageWithIdpAuth)(projRoot)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addConvert)(projRoot)];
                case 5:
                    _a.sent();
                    if (!(frontend === 'flutter')) return [3 /*break*/, 7];
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushWithoutCodegen)(projRoot)];
                case 6:
                    _a.sent();
                    return [3 /*break*/, 9];
                case 7: return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPush)(projRoot)];
                case 8:
                    _a.sent();
                    _a.label = 9;
                case 9: return [2 /*return*/];
            }
        });
    }); };
    var generatePullConfig = function (frontend) { return __awaiter(void 0, void 0, void 0, function () {
        var meta, stackName, pathToExportGeneratedConfig;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    meta = (0, amplify_e2e_core_1.getBackendAmplifyMeta)(projRoot);
                    stackName = _.get(meta, ['providers', 'awscloudformation', 'StackName']);
                    pathToExportGeneratedConfig = path.join(projRoot, 'exportSrc');
                    fs.ensureDir(pathToExportGeneratedConfig);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.exportPullBackend)(projRoot, {
                            exportPath: pathToExportGeneratedConfig,
                            frontend: frontend,
                            rootStackName: stackName,
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/, pathToExportGeneratedConfig];
            }
        });
    }); };
});
//# sourceMappingURL=export-pull-c.test.js.map