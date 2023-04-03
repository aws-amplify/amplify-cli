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
describe('add function with layers for runtime nodeJS', function () {
    var projRoot;
    var projName;
    var lambdaTestString = 'Hello from Lambda!';
    var helloWorldSuccessOutput = 'HELLO FROM LAMBDA! data';
    var functionName;
    var runtimes = ['nodejs'];
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('functions')];
                case 1:
                    projRoot = _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, {})];
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
    it('can add project layers and external layers for nodejs', function () { return __awaiter(void 0, void 0, void 0, function () {
        var shortId, settings, packageJsonContent, functionCode, layerOptions, payload, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    shortId = (0, uuid_1.v4)().split('-')[0];
                    settings = {
                        layerName: "nodetestlayer".concat(shortId),
                        projName: projName,
                        runtimes: runtimes,
                    };
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addLayer)(projRoot, settings)];
                case 1:
                    _a.sent();
                    (0, amplify_e2e_core_1.addOptData)(projRoot, {
                        layerName: settings.layerName,
                        projName: projName,
                    });
                    packageJsonContent = (0, amplify_e2e_core_1.loadFunctionTestFile)('case-layer-package.json');
                    functionCode = (0, amplify_e2e_core_1.loadFunctionTestFile)('case-function.js');
                    functionCode = functionCode.replace('{{testString}}', lambdaTestString);
                    (0, amplify_e2e_core_1.overrideLayerCodeNode)(projRoot, projName, settings.layerName, packageJsonContent, 'package.json');
                    layerOptions = {
                        select: ["".concat(settings.layerName)],
                        expectedListOptions: ["".concat(settings.layerName)],
                    };
                    functionName = "nodetestfunction".concat(shortId);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, { functionTemplate: 'Hello World', layerOptions: layerOptions, name: functionName }, 'nodejs')];
                case 2:
                    _a.sent();
                    (0, amplify_e2e_core_1.overrideFunctionSrcNode)(projRoot, functionName, functionCode);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushLayer)(projRoot, {
                            acceptSuggestedLayerVersionConfigurations: true,
                        })];
                case 3:
                    _a.sent();
                    payload = '{}';
                    return [4 /*yield*/, (0, amplify_e2e_core_1.functionCloudInvoke)(projRoot, { funcName: functionName, payload: payload })];
                case 4:
                    response = _a.sent();
                    expect(JSON.parse(JSON.parse(response.Payload.toString()).body)).toEqual(helloWorldSuccessOutput);
                    return [2 /*return*/];
            }
        });
    }); });
    it('can add multiple project layers for nodejs', function () { return __awaiter(void 0, void 0, void 0, function () {
        var shortId, settings, settings2, packageJsonContent, functionCode, layerOptions, payload, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    shortId = (0, uuid_1.v4)().split('-')[0];
                    settings = {
                        layerName: "nodetestlayer".concat(shortId),
                        projName: projName,
                        runtimes: runtimes,
                    };
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addLayer)(projRoot, settings)];
                case 1:
                    _a.sent();
                    (0, amplify_e2e_core_1.addOptData)(projRoot, {
                        layerName: settings.layerName,
                        projName: projName,
                    });
                    shortId = (0, uuid_1.v4)().split('-')[0];
                    settings2 = {
                        layerName: "nodetestlayer2".concat(shortId),
                        projName: projName,
                        runtimes: runtimes,
                    };
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addLayer)(projRoot, settings2)];
                case 2:
                    _a.sent();
                    packageJsonContent = (0, amplify_e2e_core_1.loadFunctionTestFile)('case-layer-package.json');
                    functionCode = (0, amplify_e2e_core_1.loadFunctionTestFile)('case-function.js');
                    functionCode = functionCode.replace('{{testString}}', lambdaTestString);
                    (0, amplify_e2e_core_1.overrideLayerCodeNode)(projRoot, projName, settings2.layerName, packageJsonContent, 'package.json');
                    layerOptions = {
                        select: ["".concat(settings.layerName), "".concat(settings2.layerName)],
                        expectedListOptions: ["".concat(settings.layerName), "".concat(settings2.layerName)],
                    };
                    functionName = "nodetestfunction".concat(shortId);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, { functionTemplate: 'Hello World', layerOptions: layerOptions, name: functionName }, 'nodejs')];
                case 3:
                    _a.sent();
                    (0, amplify_e2e_core_1.overrideFunctionSrcNode)(projRoot, functionName, functionCode);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushLayer)(projRoot, {
                            acceptSuggestedLayerVersionConfigurations: true,
                        })];
                case 4:
                    _a.sent();
                    payload = '{}';
                    return [4 /*yield*/, (0, amplify_e2e_core_1.functionCloudInvoke)(projRoot, { funcName: functionName, payload: payload })];
                case 5:
                    response = _a.sent();
                    expect(JSON.parse(JSON.parse(response.Payload.toString()).body)).toEqual(helloWorldSuccessOutput);
                    return [2 /*return*/];
            }
        });
    }); });
});
describe('add function with layers for runtime python', function () {
    var projRoot;
    var projName;
    var lambdaTestString = 'hello from lambda!';
    var helloWorldSuccessOutput = 'Hello From Lambda! data';
    var shortId = (0, uuid_1.v4)().split('-')[0];
    var functionName;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        var runtimes, settings, pipfileContent, functionCode, layerOptions;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('functions')];
                case 1:
                    projRoot = _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, {})];
                case 2:
                    _a.sent();
                    (projName = (0, amplify_e2e_core_1.getProjectConfig)(projRoot).projectName);
                    runtimes = ['python'];
                    settings = {
                        layerName: "pytestlayer".concat(shortId),
                        projName: projName,
                        runtimes: runtimes,
                    };
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addLayer)(projRoot, settings)];
                case 3:
                    _a.sent();
                    (0, amplify_e2e_core_1.addOptData)(projRoot, {
                        layerName: settings.layerName,
                        projName: projName,
                    });
                    pipfileContent = (0, amplify_e2e_core_1.loadFunctionTestFile)('titlecase.pipfile');
                    functionCode = (0, amplify_e2e_core_1.loadFunctionTestFile)('titlecase.py');
                    functionCode = functionCode.replace('{{testString}}', lambdaTestString);
                    (0, amplify_e2e_core_1.overrideLayerCodePython)(projRoot, settings.projName, settings.layerName, pipfileContent, 'Pipfile');
                    layerOptions = {
                        select: ["".concat(settings.layerName)],
                        expectedListOptions: ["".concat(settings.layerName)],
                    };
                    functionName = "pytestfunction".concat(shortId);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, { functionTemplate: 'Hello World', layerOptions: layerOptions, name: functionName }, 'python')];
                case 4:
                    _a.sent();
                    (0, amplify_e2e_core_1.overrideFunctionSrcPython)(projRoot, functionName, functionCode);
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
    it('can add project layers and external layers for python', function () { return __awaiter(void 0, void 0, void 0, function () {
        var payload, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushLayer)(projRoot, {
                        acceptSuggestedLayerVersionConfigurations: true,
                    })];
                case 1:
                    _a.sent();
                    payload = '{}';
                    return [4 /*yield*/, (0, amplify_e2e_core_1.functionCloudInvoke)(projRoot, { funcName: functionName, payload: payload })];
                case 2:
                    response = _a.sent();
                    expect(JSON.parse(response.Payload.toString()).body).toMatch(helloWorldSuccessOutput);
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=function_4.test.js.map