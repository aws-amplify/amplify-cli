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
describe('upload Studio CMS assets on push', function () {
    var projRoot;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('studio-cms-upload')];
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
    it.each([
        [true, true],
        [false, true],
        [false, false],
    ])('uploads expected CMS assets to shared location in S3 bucket %p %p', function (isStudioEnabled, apiWithConflictDetection) { return __awaiter(void 0, void 0, void 0, function () {
        var name, defaultsSettings, originalProjectConfig, meta, appId, region, localEnvInfo, envName;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    name = "cms".concat(isStudioEnabled).concat(apiWithConflictDetection);
                    defaultsSettings = {
                        disableAmplifyAppCreation: false,
                        name: name,
                    };
                    // init an android project to check that studio modelgen generates JS types even with other frontend config
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initAndroidProjectWithProfile)(projRoot, defaultsSettings)];
                case 1:
                    // init an android project to check that studio modelgen generates JS types even with other frontend config
                    _e.sent();
                    originalProjectConfig = (0, amplify_e2e_core_1.getProjectConfig)(projRoot);
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    appId = (_b = (_a = meta.providers) === null || _a === void 0 ? void 0 : _a.awscloudformation) === null || _b === void 0 ? void 0 : _b.AmplifyAppId;
                    region = (_d = (_c = meta.providers) === null || _c === void 0 ? void 0 : _c.awscloudformation) === null || _d === void 0 ? void 0 : _d.Region;
                    localEnvInfo = (0, amplify_e2e_core_1.getLocalEnvInfo)(projRoot);
                    envName = localEnvInfo.envName;
                    if (!isStudioEnabled) return [3 /*break*/, 3];
                    expect(appId).toBeDefined();
                    // setup Amplify Studio backend
                    return [4 /*yield*/, (0, amplify_e2e_core_1.enableAdminUI)(appId, envName, region)];
                case 2:
                    // setup Amplify Studio backend
                    _e.sent();
                    _e.label = 3;
                case 3:
                    if (!apiWithConflictDetection) return [3 /*break*/, 5];
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addApiWithBlankSchemaAndConflictDetection)(projRoot, { transformerVersion: 2 })];
                case 4:
                    _e.sent();
                    return [3 /*break*/, 7];
                case 5: return [4 /*yield*/, (0, amplify_e2e_core_1.addApiWithBlankSchema)(projRoot, { transformerVersion: 2 })];
                case 6:
                    _e.sent();
                    _e.label = 7;
                case 7: return [4 /*yield*/, (0, amplify_e2e_core_1.updateApiSchema)(projRoot, name, 'simple_model.graphql')];
                case 8:
                    _e.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPush)(projRoot)];
                case 9:
                    _e.sent();
                    // expect CMS assets to be present in S3
                    return [4 /*yield*/, expect((0, amplify_e2e_core_1.getDeploymentBucketObject)(projRoot, "models/".concat(name, "/schema.graphql"))).resolves.toMatchInlineSnapshot("\n            \"type Todo @model {\n              id: ID!\n              content: String\n            }\n            \"\n          ")];
                case 10:
                    // expect CMS assets to be present in S3
                    _e.sent();
                    return [4 /*yield*/, expect((0, amplify_e2e_core_1.getDeploymentBucketObject)(projRoot, "models/".concat(name, "/schema.js"))).resolves.toMatchSnapshot()];
                case 11:
                    _e.sent();
                    return [4 /*yield*/, expect((0, amplify_e2e_core_1.getDeploymentBucketObject)(projRoot, "models/".concat(name, "/modelIntrospection.json"))).resolves.toMatchSnapshot()];
                case 12:
                    _e.sent();
                    // expect project config to be unmodified
                    expect((0, amplify_e2e_core_1.getProjectConfig)(projRoot)).toEqual(originalProjectConfig);
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=studio-modelgen.test.js.map