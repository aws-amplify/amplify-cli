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
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
var path = __importStar(require("path"));
var amplify_cli_core_1 = require("amplify-cli-core");
describe('amplify export backend', function () {
    var projRoot;
    var projName = 'exporttest';
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)(projName)];
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
    it('init a js project and export', function () { return __awaiter(void 0, void 0, void 0, function () {
        var exportPath, name, pathToExport, pathToStackMappings, pathToManifest, stackMappings, manifest, buildFolder;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, { envName: 'dev' })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addAuthWithMaxOptions)(projRoot, {})];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addApiWithoutSchema)(projRoot, { transformerVersion: 1 })];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addS3StorageWithIdpAuth)(projRoot)];
                case 4:
                    _a.sent();
                    exportPath = path.join(projRoot, 'exportedBackend');
                    return [4 /*yield*/, (0, amplify_e2e_core_1.exportBackend)(projRoot, { exportPath: exportPath })];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPush)(projRoot)];
                case 6:
                    _a.sent();
                    name = (0, amplify_e2e_core_1.getProjectConfig)(projRoot).projectName;
                    pathToExport = path.join(exportPath, "amplify-export-".concat(name));
                    pathToStackMappings = path.join(pathToExport, 'category-stack-mapping.json');
                    pathToManifest = path.join(pathToExport, 'amplify-export-manifest.json');
                    stackMappings = amplify_cli_core_1.JSONUtilities.readJson(pathToStackMappings);
                    manifest = amplify_cli_core_1.JSONUtilities.readJson(pathToManifest);
                    buildFolder = path.join(projRoot, 'amplify', 'backend', 'awscloudformation', 'build');
                    stackMappings.forEach(function (mapping) {
                        var template1 = getTemplateForMapping(mapping, buildFolder);
                        var stack = manifest.props.loadNestedStacks[mapping.category + mapping.resourceName];
                        var template2 = (0, amplify_cli_core_1.readCFNTemplate)(path.join(pathToExport, stack.templateFile)).cfnTemplate;
                        matchTemplates(template1, template2);
                    });
                    return [2 /*return*/];
            }
        });
    }); });
});
function matchTemplates(template, exporttemplate) {
    // matches count and parameters
    expect(Object.keys(template.Parameters)).toEqual(Object.keys(exporttemplate.Parameters));
    // matches the types and counts of resources since logical ids not idempotent
    expect(getTypeCountMap(template.Resources)).toEqual(getTypeCountMap(exporttemplate.Resources));
    // matches count and name of outputs
    expect(Object.keys(template.Outputs)).toEqual(Object.keys(exporttemplate.Outputs));
}
function getTypeCountMap(resources) {
    return Object.keys(resources).reduce(function (map, key) {
        var resourceType = resources[key].Type;
        if (map.has(resourceType)) {
            map.set(resourceType, map.get(resourceType) + 1);
        }
        else {
            map.set(resourceType, 1);
        }
        return map;
    }, new Map());
}
function getTemplateForMapping(mapping, buildFolder) {
    var cfnFileName = 'cloudformation-template.json';
    if (mapping.service !== 'AppSync' && mapping.service !== 'S3') {
        cfnFileName = "".concat(mapping.resourceName, "-").concat(cfnFileName);
    }
    var templatePath = mapping.category === 'function'
        ? path.join(buildFolder, mapping.category, mapping.resourceName, cfnFileName)
        : path.join(buildFolder, mapping.category, mapping.resourceName, 'build', cfnFileName);
    return (0, amplify_cli_core_1.readCFNTemplate)(templatePath).cfnTemplate;
}
//# sourceMappingURL=export.test.js.map