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
describe('test amplify remove function', function () {
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
    it('init a project, add layer, push 4 layer versions and delete first 3 of them, then push and verify', function () { return __awaiter(void 0, void 0, void 0, function () {
        var shortId, layerName, runtime, settings, arns, _a, _b, _c, _i, i, removeVersion;
        return __generator(this, function (_d) {
            switch (_d.label) {
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
                    _d.sent();
                    expect((0, amplify_e2e_core_1.validateLayerDir)(projRoot, { projName: projName, layerName: settings.layerName }, settings.runtimes)).toBe(true);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushLayer)(projRoot, {
                            acceptSuggestedLayerVersionConfigurations: true,
                        })];
                case 2:
                    _d.sent();
                    arns.push((0, amplify_e2e_core_1.getCurrentLayerArnFromMeta)(projRoot, settings));
                    _a = [1, 2, 3];
                    _b = [];
                    for (_c in _a)
                        _b.push(_c);
                    _i = 0;
                    _d.label = 3;
                case 3:
                    if (!(_i < _b.length)) return [3 /*break*/, 6];
                    _c = _b[_i];
                    if (!(_c in _a)) return [3 /*break*/, 5];
                    i = _c;
                    (0, amplify_e2e_core_1.updateOptData)(projRoot, settings, i);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushLayer)(projRoot, {
                            acceptSuggestedLayerVersionConfigurations: true,
                        })];
                case 4:
                    _d.sent();
                    arns.push((0, amplify_e2e_core_1.getCurrentLayerArnFromMeta)(projRoot, settings));
                    _d.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6:
                    removeVersion = [1, 2, 3];
                    return [4 /*yield*/, (0, amplify_e2e_core_1.removeLayerVersion)(projRoot, {}, removeVersion, [1, 2, 3, 4])];
                case 7:
                    _d.sent();
                    (0, amplify_e2e_core_1.updateOptData)(projRoot, settings, 'end');
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushLayer)(projRoot, {
                            acceptSuggestedLayerVersionConfigurations: true,
                        })];
                case 8:
                    _d.sent();
                    arns.push((0, amplify_e2e_core_1.getCurrentLayerArnFromMeta)(projRoot, settings));
                    arns.splice(0, 3);
                    (0, amplify_e2e_core_1.validateLayerMetadata)(projRoot, settings, (0, amplify_e2e_core_1.getProjectMeta)(projRoot), envName, arns);
                    return [2 /*return*/];
            }
        });
    }); });
    it('init a project, add layer, push 2 layer versions, add 2 dependent functions, check that removal is blocked', function () { return __awaiter(void 0, void 0, void 0, function () {
        var shortId, layerName, runtime, settings, arns, fnName1, fnName2;
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
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushLayer)(projRoot, { acceptSuggestedLayerVersionConfigurations: true })];
                case 2:
                    _a.sent();
                    arns.push((0, amplify_e2e_core_1.getCurrentLayerArnFromMeta)(projRoot, settings));
                    (0, amplify_e2e_core_1.updateOptData)(projRoot, settings, 'update');
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushLayer)(projRoot, { acceptSuggestedLayerVersionConfigurations: true })];
                case 3:
                    _a.sent();
                    arns.push((0, amplify_e2e_core_1.getCurrentLayerArnFromMeta)(projRoot, settings));
                    fnName1 = "integtestFn1".concat(shortId);
                    fnName2 = "integtestFn2".concat(shortId);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, {
                            functionTemplate: 'Hello World',
                            name: fnName1,
                            layerOptions: {
                                layerWalkthrough: function (chain) {
                                    chain
                                        .wait('Provide existing layers')
                                        .sendKeyDown()
                                        .send(' ')
                                        .sendCarriageReturn()
                                        .wait("Select a version for ".concat(projName + layerName))
                                        .sendKeyDown(2) // Move from Always choose latest version to version 1
                                        .sendCarriageReturn();
                                },
                            },
                        }, runtime)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, {
                            functionTemplate: 'Hello World',
                            name: fnName2,
                            layerOptions: {
                                layerWalkthrough: function (chain) {
                                    chain
                                        .wait('Provide existing layers')
                                        .sendKeyDown()
                                        .send(' ')
                                        .sendCarriageReturn()
                                        .wait("Select a version for ".concat(projName + layerName))
                                        .sendKeyDown() // Move from Always choose latest version to version 2
                                        .sendCarriageReturn();
                                },
                            },
                        }, runtime)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.removeLayerVersion)(projRoot, { removeNoLayerVersions: true }, [1, 2], [1, 2])];
                case 6:
                    _a.sent();
                    (0, amplify_e2e_core_1.validateLayerMetadata)(projRoot, settings, (0, amplify_e2e_core_1.getProjectMeta)(projRoot), envName, arns);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.removeFunction)(projRoot, fnName1)];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.removeFunction)(projRoot, fnName2)];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.removeLayerVersion)(projRoot, {}, [1], [1, 2])];
                case 9:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                case 10:
                    _a.sent();
                    (0, amplify_e2e_core_1.validateLayerMetadata)(projRoot, settings, (0, amplify_e2e_core_1.getProjectMeta)(projRoot), envName, arns.splice(1));
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=layer-3.test.js.map