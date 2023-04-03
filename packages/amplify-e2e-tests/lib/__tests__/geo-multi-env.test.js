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
var env_1 = require("../environment/env");
var awsExports_1 = require("../aws-exports/awsExports");
describe('environment commands with geo resources', function () {
    var projRoot;
    var map1Id = "map".concat((0, amplify_e2e_core_1.generateRandomShortId)());
    var index1Id = "index".concat((0, amplify_e2e_core_1.generateRandomShortId)());
    var awsExport;
    beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('env-test')];
                case 1:
                    projRoot = _a.sent();
                    //Add default auth, map and index in enva
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, { envName: 'enva' })];
                case 2:
                    //Add default auth, map and index in enva
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addAuthWithDefault)(projRoot)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addMapWithDefault)(projRoot, { resourceName: map1Id, isDefault: true })];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addPlaceIndexWithDefault)(projRoot, { resourceName: index1Id, isDefault: true })];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushWithoutCodegen)(projRoot)];
                case 6:
                    _a.sent();
                    //Initialize new envb and add default auth
                    return [4 /*yield*/, (0, env_1.addEnvironment)(projRoot, { envName: 'envb' })];
                case 7:
                    //Initialize new envb and add default auth
                    _a.sent();
                    return [4 /*yield*/, (0, env_1.listEnvironment)(projRoot, { numEnv: 2 })];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, (0, env_1.checkoutEnvironment)(projRoot, { envName: 'envb', restoreBackend: true })];
                case 9:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addAuthWithDefault)(projRoot)];
                case 10:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushWithoutCodegen)(projRoot)];
                case 11:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    afterAll(function () { return __awaiter(void 0, void 0, void 0, function () {
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
    //reset local require of exports files
    beforeEach(function () { return jest.resetModules(); });
    it('should generate correct meta file and exports file in the original environment', function () { return __awaiter(void 0, void 0, void 0, function () {
        var meta, region, map1Name, index1Name, map1, index1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, env_1.checkoutEnvironment)(projRoot, { envName: 'enva', restoreBackend: true })];
                case 1:
                    _a.sent();
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    expect(meta.geo).toBeDefined();
                    expect(meta.geo[map1Id].isDefault).toBe(true);
                    expect(meta.geo[index1Id].isDefault).toBe(true);
                    region = meta.geo[map1Id].output.Region;
                    map1Name = meta.geo[map1Id].output.Name;
                    index1Name = meta.geo[index1Id].output.Name;
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getMap)(map1Name, region)];
                case 2:
                    map1 = _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getPlaceIndex)(index1Name, region)];
                case 3:
                    index1 = _a.sent();
                    expect(map1.MapName).toBeDefined();
                    expect(index1.IndexName).toBeDefined();
                    //Validate exports file
                    awsExport = (0, awsExports_1.getAWSExports)(projRoot).default;
                    expect((0, amplify_e2e_core_1.getGeoJSConfiguration)(awsExport).maps.items[map1Name]).toBeDefined();
                    expect((0, amplify_e2e_core_1.getGeoJSConfiguration)(awsExport).search_indices.items).toContain(index1Name);
                    expect((0, amplify_e2e_core_1.getGeoJSConfiguration)(awsExport).maps.default).toEqual(map1Name);
                    expect((0, amplify_e2e_core_1.getGeoJSConfiguration)(awsExport).search_indices.default).toEqual(index1Name);
                    expect((0, amplify_e2e_core_1.getGeoJSConfiguration)(awsExport).region).toEqual(region);
                    return [2 /*return*/];
            }
        });
    }); });
    it('should generate correct meta file and exports file after adding a new map in new environment', function () { return __awaiter(void 0, void 0, void 0, function () {
        var map2Id, meta, region, map2Name, map2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, env_1.checkoutEnvironment)(projRoot, { envName: 'envb', restoreBackend: true })];
                case 1:
                    _a.sent();
                    map2Id = "map".concat((0, amplify_e2e_core_1.generateRandomShortId)());
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addMapWithDefault)(projRoot, { resourceName: map2Id, isDefault: true })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushWithoutCodegen)(projRoot)];
                case 3:
                    _a.sent();
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    expect(meta.geo).toBeDefined();
                    expect(meta.geo[map2Id].isDefault).toBe(true);
                    region = meta.geo[map2Id].output.Region;
                    map2Name = meta.geo[map2Id].output.Name;
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getMap)(map2Name, region)];
                case 4:
                    map2 = _a.sent();
                    expect(map2.MapName).toBeDefined();
                    //Validate exports file
                    awsExport = (0, awsExports_1.getAWSExports)(projRoot).default;
                    expect((0, amplify_e2e_core_1.getGeoJSConfiguration)(awsExport).maps.items[map2Name]).toBeDefined();
                    expect((0, amplify_e2e_core_1.getGeoJSConfiguration)(awsExport).maps.default).toEqual(map2Name);
                    expect((0, amplify_e2e_core_1.getGeoJSConfiguration)(awsExport).region).toEqual(region);
                    return [2 /*return*/];
            }
        });
    }); });
    it('should generate correct meta file and exports file after adding a new index in new environment', function () { return __awaiter(void 0, void 0, void 0, function () {
        var index2Id, meta, region, index2Name, index2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, env_1.checkoutEnvironment)(projRoot, { envName: 'envb', restoreBackend: true })];
                case 1:
                    _a.sent();
                    index2Id = "index".concat((0, amplify_e2e_core_1.generateRandomShortId)());
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addPlaceIndexWithDefault)(projRoot, { resourceName: index2Id, isDefault: true })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushWithoutCodegen)(projRoot)];
                case 3:
                    _a.sent();
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    expect(meta.geo).toBeDefined();
                    expect(meta.geo[index2Id].isDefault).toBe(true);
                    region = meta.geo[index2Id].output.Region;
                    index2Name = meta.geo[index2Id].output.Name;
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getPlaceIndex)(index2Name, region)];
                case 4:
                    index2 = _a.sent();
                    expect(index2.IndexName).toBeDefined();
                    //Validate exports file
                    awsExport = (0, awsExports_1.getAWSExports)(projRoot).default;
                    expect((0, amplify_e2e_core_1.getGeoJSConfiguration)(awsExport).search_indices.items).toContain(index2Name);
                    expect((0, amplify_e2e_core_1.getGeoJSConfiguration)(awsExport).search_indices.default).toEqual(index2Name);
                    expect((0, amplify_e2e_core_1.getGeoJSConfiguration)(awsExport).region).toEqual(region);
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=geo-multi-env.test.js.map