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
var uuid_1 = require("uuid");
var env_1 = require("../environment/env");
describe('amplify add lambda layer', function () {
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
    it('init a project and add simple layer', function () { return __awaiter(void 0, void 0, void 0, function () {
        var shortId, layerName, runtime, settings, arns;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    shortId = (0, uuid_1.v4)().split('-')[0];
                    layerName = "simplelayer".concat(shortId);
                    runtime = 'nodejs';
                    settings = {
                        runtimes: [runtime],
                        layerName: layerName,
                        projName: projName,
                    };
                    arns = [];
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addLayer)(projRoot, settings)];
                case 1:
                    _a.sent();
                    expect((0, amplify_e2e_core_1.validateLayerDir)(projRoot, { projName: projName, layerName: settings.layerName }, settings.runtimes)).toBe(true);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushLayer)(projRoot, {
                            acceptSuggestedLayerVersionConfigurations: true,
                        })];
                case 2:
                    _a.sent();
                    arns.push((0, amplify_e2e_core_1.getCurrentLayerArnFromMeta)(projRoot, settings));
                    (0, amplify_e2e_core_1.addOptData)(projRoot, settings);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushLayer)(projRoot, {
                            acceptSuggestedLayerVersionConfigurations: true,
                        })];
                case 3:
                    _a.sent();
                    arns.push((0, amplify_e2e_core_1.getCurrentLayerArnFromMeta)(projRoot, settings));
                    return [4 /*yield*/, (0, amplify_e2e_core_1.validateLayerMetadata)(projRoot, settings, (0, amplify_e2e_core_1.getProjectMeta)(projRoot), envName, arns)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.removeLayer)(projRoot, [1, 2], [1, 2])];
                case 5:
                    _a.sent();
                    expect((0, amplify_e2e_core_1.validateLayerDir)(projRoot, settings, settings.runtimes)).toBe(false);
                    return [2 /*return*/];
            }
        });
    }); });
    it('init a project and add/update simple layer and push', function () { return __awaiter(void 0, void 0, void 0, function () {
        var shortId, layerName, runtime, settingsAdd, settingsUpdate, arns;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    shortId = (0, uuid_1.v4)().split('-')[0];
                    layerName = "testlayer".concat(shortId);
                    runtime = 'nodejs';
                    settingsAdd = {
                        runtimes: [runtime],
                        layerName: layerName,
                        projName: projName,
                    };
                    settingsUpdate = {
                        runtimes: [runtime],
                        layerName: layerName,
                        versions: 0,
                        permissions: ['Public (Anyone on AWS can use this layer)'],
                        numLayers: 1,
                        projName: projName,
                    };
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addLayer)(projRoot, settingsAdd)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateLayer)(projRoot, settingsUpdate)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushLayer)(projRoot, {
                            acceptSuggestedLayerVersionConfigurations: true,
                        })];
                case 3:
                    _a.sent();
                    arns = [(0, amplify_e2e_core_1.getCurrentLayerArnFromMeta)(projRoot, settingsAdd)];
                    return [4 /*yield*/, (0, amplify_e2e_core_1.validateLayerMetadata)(projRoot, settingsUpdate, (0, amplify_e2e_core_1.getProjectMeta)(projRoot), envName, arns)];
                case 4:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('init a project and add/push and update/push updating version', function () { return __awaiter(void 0, void 0, void 0, function () {
        var shortId, layerName, runtime, settingsAdd, settingsUpdate, arns;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    shortId = (0, uuid_1.v4)().split('-')[0];
                    layerName = "testlayer".concat(shortId);
                    runtime = 'nodejs';
                    settingsAdd = {
                        runtimes: [runtime],
                        layerName: layerName,
                        projName: projName,
                    };
                    settingsUpdate = {
                        runtimes: [runtime],
                        layerName: layerName,
                        versionChanged: true,
                        permissions: ['Public (Anyone on AWS can use this layer)'],
                        numLayers: 1,
                        versions: 1,
                        projName: projName,
                    };
                    arns = [];
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addLayer)(projRoot, settingsAdd)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushLayer)(projRoot, {
                            acceptSuggestedLayerVersionConfigurations: true,
                        })];
                case 2:
                    _a.sent();
                    arns.push((0, amplify_e2e_core_1.getCurrentLayerArnFromMeta)(projRoot, settingsAdd));
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateLayer)(projRoot, settingsUpdate)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.validateLayerMetadata)(projRoot, settingsUpdate, (0, amplify_e2e_core_1.getProjectMeta)(projRoot), envName, arns)];
                case 5:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('init a project and add/push and update/push without updating version', function () { return __awaiter(void 0, void 0, void 0, function () {
        var shortId, layerName, runtime, settingsAdd, settingsUpdate, arns;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    shortId = (0, uuid_1.v4)().split('-')[0];
                    layerName = "testlayer".concat(shortId);
                    runtime = 'nodejs';
                    settingsAdd = {
                        runtimes: [runtime],
                        layerName: layerName,
                        projName: projName,
                    };
                    settingsUpdate = {
                        runtimes: [runtime],
                        layerName: layerName,
                        numLayers: 1,
                        permissions: undefined,
                        versions: 1,
                        projName: projName,
                    };
                    arns = [];
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addLayer)(projRoot, settingsAdd)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushLayer)(projRoot, {
                            acceptSuggestedLayerVersionConfigurations: true,
                        })];
                case 2:
                    _a.sent();
                    settingsUpdate.permissions = ['Public (Anyone on AWS can use this layer)'];
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateLayer)(projRoot, settingsUpdate)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                case 4:
                    _a.sent();
                    arns.push((0, amplify_e2e_core_1.getCurrentLayerArnFromMeta)(projRoot, { layerName: layerName, projName: projName }));
                    return [4 /*yield*/, (0, amplify_e2e_core_1.validateLayerMetadata)(projRoot, { layerName: layerName, projName: projName }, (0, amplify_e2e_core_1.getProjectMeta)(projRoot), envName, arns)];
                case 5:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('init a project, add/push layer, change layer content, push layer using previous permissions, test env add and env checkout', function () { return __awaiter(void 0, void 0, void 0, function () {
        var shortId, layerName, runtime, permissions, settings, noLayerEnv, integtestArns, expectedPerms, layerTestArns, newEnvName;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    shortId = (0, uuid_1.v4)().split('-')[0];
                    layerName = "testlayer".concat(shortId);
                    runtime = 'nodejs';
                    permissions = ['Public (Anyone on AWS can use this layer)'];
                    settings = {
                        runtimes: [runtime],
                        layerName: layerName,
                        permissions: permissions,
                        versionChanged: false,
                        numLayers: 1,
                        projName: projName,
                    };
                    noLayerEnv = 'nolayerenv';
                    return [4 /*yield*/, (0, env_1.addEnvironment)(projRoot, { envName: noLayerEnv })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, env_1.checkoutEnvironment)(projRoot, { envName: envName })];
                case 2:
                    _a.sent();
                    integtestArns = [];
                    expectedPerms = [{ type: amplify_e2e_core_1.LayerPermissionName.public }];
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addLayer)(projRoot, settings)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushLayer)(projRoot, {
                            acceptSuggestedLayerVersionConfigurations: true,
                        })];
                case 4:
                    _a.sent();
                    integtestArns.push((0, amplify_e2e_core_1.getCurrentLayerArnFromMeta)(projRoot, settings));
                    (0, amplify_e2e_core_1.validatePushedVersion)(projRoot, settings, expectedPerms);
                    (0, amplify_e2e_core_1.addOptData)(projRoot, settings);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushLayer)(projRoot, {
                            acceptSuggestedLayerVersionConfigurations: true,
                        })];
                case 5:
                    _a.sent();
                    integtestArns.push((0, amplify_e2e_core_1.getCurrentLayerArnFromMeta)(projRoot, settings));
                    (0, amplify_e2e_core_1.validatePushedVersion)(projRoot, settings, expectedPerms);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.validateLayerMetadata)(projRoot, settings, (0, amplify_e2e_core_1.getProjectMeta)(projRoot), envName, integtestArns)];
                case 6:
                    _a.sent();
                    layerTestArns = [];
                    newEnvName = 'layertest';
                    return [4 /*yield*/, (0, env_1.addEnvironment)(projRoot, { envName: newEnvName, numLayers: 1 })];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, (0, env_1.listEnvironment)(projRoot, { numEnv: 3 })];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushLayer)(projRoot, { acceptSuggestedLayerVersionConfigurations: true })];
                case 9:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyStatus)(projRoot, 'No Change')];
                case 10:
                    _a.sent();
                    layerTestArns.push((0, amplify_e2e_core_1.getCurrentLayerArnFromMeta)(projRoot, settings));
                    (0, amplify_e2e_core_1.validatePushedVersion)(projRoot, settings, expectedPerms);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.validateLayerMetadata)(projRoot, settings, (0, amplify_e2e_core_1.getProjectMeta)(projRoot), newEnvName, layerTestArns)];
                case 11:
                    _a.sent();
                    // Test to make sure we can checkout and push a previously created env where the layer does not exist yet
                    return [4 /*yield*/, (0, env_1.checkoutEnvironment)(projRoot, { envName: noLayerEnv })];
                case 12:
                    // Test to make sure we can checkout and push a previously created env where the layer does not exist yet
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushLayer)(projRoot, { acceptSuggestedLayerVersionConfigurations: true })];
                case 13:
                    _a.sent();
                    return [4 /*yield*/, (0, env_1.checkoutEnvironment)(projRoot, { envName: envName })];
                case 14:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyStatus)(projRoot, 'No Change')];
                case 15:
                    _a.sent();
                    (0, amplify_e2e_core_1.validatePushedVersion)(projRoot, settings, expectedPerms);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.validateLayerMetadata)(projRoot, settings, (0, amplify_e2e_core_1.getProjectMeta)(projRoot), envName, integtestArns)];
                case 16:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=layer-1.test.js.map