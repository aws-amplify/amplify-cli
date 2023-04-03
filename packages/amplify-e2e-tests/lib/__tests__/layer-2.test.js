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
var fs = __importStar(require("fs-extra"));
var path = __importStar(require("path"));
var rimraf = __importStar(require("rimraf"));
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
var uuid_1 = require("uuid");
describe('amplify add lambda layer with changes', function () {
    var projRoot;
    var projName;
    var envName = 'integtest';
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('layers')];
                case 1:
                    projRoot = _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, { envName: envName })];
                case 2:
                    _a.sent();
                    (projName = (0, amplify_e2e_core_1.getProjectConfig)(projRoot).projectName);
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
    it('simple layer, change future permission, no changes', function () { return __awaiter(void 0, void 0, void 0, function () {
        var shortId, layerName, layerRuntime, settings, settingsUpdate, expectedPerms;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    shortId = (0, uuid_1.v4)().split('-')[0];
                    layerName = "simplelayer".concat(shortId);
                    layerRuntime = 'nodejs';
                    settings = {
                        runtimes: [layerRuntime],
                        layerName: layerName,
                        projName: projName,
                    };
                    settingsUpdate = {
                        runtimes: [layerRuntime],
                        layerName: layerName,
                        changePermissionOnFutureVersion: true,
                        permissions: ['Public (Anyone on AWS can use this layer)'],
                        numLayers: 1,
                        projName: projName,
                    };
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addLayer)(projRoot, settings)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushLayer)(projRoot, {
                            acceptSuggestedLayerVersionConfigurations: true,
                            usePreviousPermissions: true,
                        })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateLayer)(projRoot, settingsUpdate)];
                case 3:
                    _a.sent();
                    expectedPerms = [{ type: amplify_e2e_core_1.LayerPermissionName.public }];
                    (0, amplify_e2e_core_1.validatePushedVersion)(projRoot, { layerName: layerName, projName: projName }, expectedPerms);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyStatus)(projRoot, 'No Change')];
                case 4:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('simple layer, change latest permission, update status, no new layer version', function () { return __awaiter(void 0, void 0, void 0, function () {
        var shortId, layerName, layerRuntime, settings, settingsUpdate, firstArn, expectedPerms, secondArn;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    shortId = (0, uuid_1.v4)().split('-')[0];
                    layerName = "simplelayer".concat(shortId);
                    layerRuntime = 'nodejs';
                    settings = {
                        runtimes: [layerRuntime],
                        layerName: layerName,
                        projName: projName,
                    };
                    settingsUpdate = {
                        runtimes: [layerRuntime],
                        layerName: layerName,
                        changePermissionOnLatestVersion: true,
                        permissions: ['Public (Anyone on AWS can use this layer)'],
                        numLayers: 1,
                        projName: projName,
                    };
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addLayer)(projRoot, settings)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushLayer)(projRoot, {
                            acceptSuggestedLayerVersionConfigurations: true,
                            usePreviousPermissions: true,
                        })];
                case 2:
                    _a.sent();
                    firstArn = (0, amplify_e2e_core_1.getCurrentLayerArnFromMeta)(projRoot, settingsUpdate);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateLayer)(projRoot, settingsUpdate)];
                case 3:
                    _a.sent();
                    expectedPerms = [{ type: amplify_e2e_core_1.LayerPermissionName.public }];
                    (0, amplify_e2e_core_1.expectEphemeralPermissions)(projRoot, settingsUpdate, envName, 1, expectedPerms);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyStatus)(projRoot, 'Update')];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                case 5:
                    _a.sent();
                    (0, amplify_e2e_core_1.expectEphemeralDataIsUndefined)(projRoot, settingsUpdate);
                    secondArn = (0, amplify_e2e_core_1.getCurrentLayerArnFromMeta)(projRoot, settings);
                    // Layer ARNs must match as no new version should have been deployed
                    expect(firstArn).toEqual(secondArn);
                    return [2 /*return*/];
            }
        });
    }); });
    it('simple layer, change update layer, select NO to permissions, no changes', function () { return __awaiter(void 0, void 0, void 0, function () {
        var shortId, layerName, layerRuntime, settings, settingsUpdate;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    shortId = (0, uuid_1.v4)().split('-')[0];
                    layerName = "simplelayer".concat(shortId);
                    layerRuntime = 'nodejs';
                    settings = {
                        runtimes: [layerRuntime],
                        layerName: layerName,
                        projName: projName,
                    };
                    settingsUpdate = {
                        runtimes: [layerRuntime],
                        layerName: layerName,
                        dontChangePermissions: true,
                        numLayers: 1,
                        projName: projName,
                    };
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addLayer)(projRoot, settings)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushLayer)(projRoot, {
                            acceptSuggestedLayerVersionConfigurations: true,
                        })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateLayer)(projRoot, settingsUpdate)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyStatus)(projRoot, 'No Change')];
                case 4:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('simple layer, update description during push', function () { return __awaiter(void 0, void 0, void 0, function () {
        var shortId, layerName, layerRuntime, settings, layerDescription;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    shortId = (0, uuid_1.v4)().split('-')[0];
                    layerName = "simplelayer".concat(shortId);
                    layerRuntime = 'nodejs';
                    settings = {
                        runtimes: [layerRuntime],
                        layerName: layerName,
                        projName: projName,
                    };
                    layerDescription = 'Custom Description from E2E';
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addLayer)(projRoot, settings)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushLayer)(projRoot, {
                            acceptSuggestedLayerVersionConfigurations: false,
                            usePreviousPermissions: true,
                            layerDescription: layerDescription,
                        })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.expectDeployedLayerDescription)(projRoot, settings, (0, amplify_e2e_core_1.getProjectMeta)(projRoot), envName, layerDescription)];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('function with layer reference, change version, test invocation', function () { return __awaiter(void 0, void 0, void 0, function () {
        var lambdaTestString, helloWorldUpperCaseOutput, helloWorldTitleCaseOutput, shortId, layerName, layerRuntime, settings, functionName, packageJsonContent, caseLayerIndexV1, caseLayerIndexV2, functionCode, layerOptions, payload, response, fullLayerName, settingsUpdate, settingsUpdateToLatestVersion;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    lambdaTestString = 'Hello from Lambda!';
                    helloWorldUpperCaseOutput = 'HELLO FROM LAMBDA!';
                    helloWorldTitleCaseOutput = 'Hello From Lambda!';
                    shortId = (0, uuid_1.v4)().split('-')[0];
                    layerName = "reflayer".concat(shortId);
                    layerRuntime = 'nodejs';
                    settings = {
                        runtimes: [layerRuntime],
                        layerName: layerName,
                        projName: projName,
                    };
                    functionName = "nodetestfunction".concat(shortId);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addLayer)(projRoot, settings)];
                case 1:
                    _b.sent();
                    packageJsonContent = (0, amplify_e2e_core_1.loadFunctionTestFile)('case-layer-package.json');
                    caseLayerIndexV1 = (0, amplify_e2e_core_1.loadFunctionTestFile)('case-layer-v1.js');
                    caseLayerIndexV2 = (0, amplify_e2e_core_1.loadFunctionTestFile)('case-layer-v2.js');
                    functionCode = (0, amplify_e2e_core_1.loadFunctionTestFile)('case-function-for-layer.js');
                    functionCode = functionCode.replace('{{testString}}', lambdaTestString);
                    (0, amplify_e2e_core_1.overrideLayerCodeNode)(projRoot, settings.projName, settings.layerName, packageJsonContent, 'package.json');
                    (0, amplify_e2e_core_1.addOptFile)(projRoot, settings.projName, settings.layerName, caseLayerIndexV1, 'casing.js');
                    layerOptions = {
                        select: ["".concat(settings.projName).concat(settings.layerName)],
                        expectedListOptions: ["".concat(settings.projName).concat(settings.layerName)],
                    };
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, { functionTemplate: 'Hello World', layerOptions: layerOptions, name: functionName }, layerRuntime)];
                case 2:
                    _b.sent();
                    (0, amplify_e2e_core_1.overrideFunctionSrcNode)(projRoot, functionName, functionCode);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushLayer)(projRoot, {
                            acceptSuggestedLayerVersionConfigurations: true,
                        })];
                case 3:
                    _b.sent();
                    payload = '{}';
                    return [4 /*yield*/, (0, amplify_e2e_core_1.functionCloudInvoke)(projRoot, { funcName: functionName, payload: payload })];
                case 4:
                    response = _b.sent();
                    expect(JSON.parse(JSON.parse(response.Payload.toString()).body)).toEqual(helloWorldUpperCaseOutput);
                    // 2. Step
                    // - Update casing.js in layer
                    // - Update function to use V1 of the layer
                    // - Push
                    // - Invoke function, result must be the same as first time (upper cased)
                    (0, amplify_e2e_core_1.addOptFile)(projRoot, settings.projName, settings.layerName, caseLayerIndexV2, 'casing.js');
                    fullLayerName = "".concat(settings.projName).concat(settings.layerName);
                    settingsUpdate = {
                        runtimes: [layerRuntime],
                        layerName: layerName,
                        projName: projName,
                        layerOptions: {
                            select: [fullLayerName],
                            expectedListOptions: [fullLayerName],
                            versions: (_a = {}, _a[fullLayerName] = { version: 1, expectedVersionOptions: [1] }, _a),
                            skipLayerAssignment: true,
                            layerAndFunctionExist: true,
                        },
                    };
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateFunction)(projRoot, settingsUpdate, layerRuntime)];
                case 5:
                    _b.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushLayer)(projRoot, {
                            acceptSuggestedLayerVersionConfigurations: true,
                        })];
                case 6:
                    _b.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.functionCloudInvoke)(projRoot, { funcName: functionName, payload: payload })];
                case 7:
                    response = _b.sent();
                    expect(JSON.parse(JSON.parse(response.Payload.toString()).body)).toEqual(helloWorldUpperCaseOutput);
                    settingsUpdateToLatestVersion = {
                        runtimes: [layerRuntime],
                        layerName: layerName,
                        projName: projName,
                        layerOptions: {
                            layerAndFunctionExist: true,
                            layerWalkthrough: function (chain) {
                                chain
                                    .wait('Provide existing layers')
                                    .sendCarriageReturn()
                                    .wait("Select a version for ".concat(fullLayerName))
                                    .sendKeyUp(2) // Move from version 1 to Always choose latest version
                                    .sendCarriageReturn();
                            },
                        },
                    };
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateFunction)(projRoot, settingsUpdateToLatestVersion, layerRuntime)];
                case 8:
                    _b.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                case 9:
                    _b.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.functionCloudInvoke)(projRoot, { funcName: functionName, payload: payload })];
                case 10:
                    response = _b.sent();
                    expect(JSON.parse(JSON.parse(response.Payload.toString()).body)).toEqual(helloWorldTitleCaseOutput);
                    return [2 /*return*/];
            }
        });
    }); });
    /*
      add node layer
      add files in opt
      push
      remove node_modules (simulate gitignore),
      amplify status -> no change
      delete yarn.lock
      amplify status -> update
      push
      -> should not create layer version, (it should force a npm/yarn), node_module should exist with content, push should succeed
    */
    it('add node layer, remove lock file, node_modules, verify status, push', function () { return __awaiter(void 0, void 0, void 0, function () {
        var shortId, layerName, layerRuntime, settings, packageJsonContent, firstArn, layerPath, secondArn;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    shortId = (0, uuid_1.v4)().split('-')[0];
                    layerName = "simplelayer".concat(shortId);
                    layerRuntime = 'nodejs';
                    settings = {
                        runtimes: [layerRuntime],
                        layerName: layerName,
                        projName: projName,
                    };
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addLayer)(projRoot, settings)];
                case 1:
                    _a.sent();
                    packageJsonContent = (0, amplify_e2e_core_1.loadFunctionTestFile)('case-layer-package.json');
                    (0, amplify_e2e_core_1.overrideLayerCodeNode)(projRoot, settings.projName, settings.layerName, packageJsonContent, 'package.json');
                    (0, amplify_e2e_core_1.addOptData)(projRoot, settings);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushLayer)(projRoot, {
                            acceptSuggestedLayerVersionConfigurations: true,
                            usePreviousPermissions: true,
                        })];
                case 2:
                    _a.sent();
                    firstArn = (0, amplify_e2e_core_1.getCurrentLayerArnFromMeta)(projRoot, { layerName: layerName, projName: projName });
                    layerPath = path.join(projRoot, 'amplify', 'backend', 'function', (0, amplify_e2e_core_1.getLayerDirectoryName)({ projName: settings.projName, layerName: settings.layerName }));
                    rimraf.sync(path.join(layerPath, 'lib', 'nodejs', 'node_modules'));
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyStatus)(projRoot, 'No Change')];
                case 3:
                    _a.sent();
                    // 3. Remove yarn.lock
                    // 4. Check status: Update
                    fs.removeSync(path.join(layerPath, 'lib', 'nodejs', 'yarn.lock'));
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyStatus)(projRoot, 'Update')];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushLayer)(projRoot, {
                            acceptSuggestedLayerVersionConfigurations: true,
                            usePreviousPermissions: true,
                        })];
                case 5:
                    _a.sent();
                    secondArn = (0, amplify_e2e_core_1.getCurrentLayerArnFromMeta)(projRoot, settings);
                    // Layer ARNs must match as no new version should have been deployed, as
                    expect(firstArn).toEqual(secondArn);
                    return [2 /*return*/];
            }
        });
    }); });
    /*
      add python layer
      add files in opt
      push
      remove lib/python3.8/site-packages (simulate gitignore),
      amplify status -> no change
      delete Pipfile.lock
      amplify status -> update
      push
      -> should not create layer version, (it should force a pip install),
      lib/python3.8/site-packages should exist with content, push should succeed
    */
    it('add python layer, remove lock file, site-packages, verify status, push', function () { return __awaiter(void 0, void 0, void 0, function () {
        var shortId, layerName, layerRuntime, settings, pipfileContent, firstArn, layerPath, secondArn;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    shortId = (0, uuid_1.v4)().split('-')[0];
                    layerName = "simplelayer".concat(shortId);
                    layerRuntime = 'python';
                    settings = {
                        runtimes: [layerRuntime],
                        layerName: layerName,
                        projName: projName,
                    };
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addLayer)(projRoot, settings)];
                case 1:
                    _a.sent();
                    pipfileContent = (0, amplify_e2e_core_1.loadFunctionTestFile)('titlecase.pipfile');
                    (0, amplify_e2e_core_1.overrideLayerCodePython)(projRoot, settings.projName, settings.layerName, pipfileContent, 'Pipfile');
                    (0, amplify_e2e_core_1.addOptData)(projRoot, settings);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushLayer)(projRoot, {
                            acceptSuggestedLayerVersionConfigurations: true,
                            usePreviousPermissions: true,
                        })];
                case 2:
                    _a.sent();
                    firstArn = (0, amplify_e2e_core_1.getCurrentLayerArnFromMeta)(projRoot, { layerName: layerName, projName: projName });
                    layerPath = path.join(projRoot, 'amplify', 'backend', 'function', (0, amplify_e2e_core_1.getLayerDirectoryName)({ projName: settings.projName, layerName: settings.layerName }));
                    rimraf.sync(path.join(layerPath, 'lib', 'python', 'lib'));
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyStatus)(projRoot, 'No Change')];
                case 3:
                    _a.sent();
                    // 3. Remove Pipfile.lock
                    // 4. Check status: Update
                    fs.removeSync(path.join(layerPath, 'lib', 'python', 'Pipfile.lock'));
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyStatus)(projRoot, 'Update')];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushLayer)(projRoot, {
                            acceptSuggestedLayerVersionConfigurations: true,
                            usePreviousPermissions: true,
                        })];
                case 5:
                    _a.sent();
                    secondArn = (0, amplify_e2e_core_1.getCurrentLayerArnFromMeta)(projRoot, settings);
                    // Layer ARNs must match as no new version should have been deployed, as
                    expect(firstArn).toEqual(secondArn);
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=layer-2.test.js.map