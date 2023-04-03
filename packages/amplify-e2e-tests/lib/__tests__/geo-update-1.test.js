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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
var fs_1 = require("fs");
var path_1 = __importDefault(require("path"));
var awsExports_1 = require("../aws-exports/awsExports");
describe('amplify geo update', function () {
    var projRoot;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('geo-update-test')];
                case 1:
                    projRoot = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    afterEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        var metaFilePath;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    metaFilePath = path_1.default.join(projRoot, 'amplify', '#current-cloud-backend', 'amplify-meta.json');
                    if (!(0, fs_1.existsSync)(metaFilePath)) return [3 /*break*/, 2];
                    return [4 /*yield*/, (0, amplify_e2e_core_1.deleteProject)(projRoot)];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2:
                    (0, amplify_e2e_core_1.deleteProjectDir)(projRoot);
                    return [2 /*return*/];
            }
        });
    }); });
    it('init a project with default auth config, add the map resource and update the auth config', function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a, map1Id, map2Id, meta, mapName, region, map, awsExport;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = (0, amplify_e2e_core_1.generateResourceIdsInOrder)(2), map1Id = _a[0], map2Id = _a[1];
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, {})];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addAuthWithDefault)(projRoot)];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addMapWithDefault)(projRoot, { resourceName: map1Id, isFirstGeoResource: true })];
                case 3:
                    _b.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addMapWithDefault)(projRoot, { resourceName: map2Id, isAdditional: true, isDefault: false })];
                case 4:
                    _b.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateMapWithDefault)(projRoot)];
                case 5:
                    _b.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushWithoutCodegen)(projRoot)];
                case 6:
                    _b.sent();
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    mapName = meta.geo[map1Id].output.Name;
                    region = meta.geo[map1Id].output.Region;
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getMap)(mapName, region)];
                case 7:
                    map = _b.sent();
                    expect(map.MapName).toBeDefined();
                    expect(meta.geo[map1Id].accessType).toBe('AuthorizedAndGuestUsers');
                    awsExport = (0, awsExports_1.getAWSExports)(projRoot).default;
                    expect((0, amplify_e2e_core_1.getGeoJSConfiguration)(awsExport).maps.items[mapName]).toBeDefined();
                    expect((0, amplify_e2e_core_1.getGeoJSConfiguration)(awsExport).maps.default).toEqual(mapName);
                    expect((0, amplify_e2e_core_1.getGeoJSConfiguration)(awsExport).region).toEqual(region);
                    return [2 /*return*/];
            }
        });
    }); });
    it('init a project with default auth config, add the place index resource and update the auth config', function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a, index1Id, index2Id, meta, placeIndexName, region, placeIndex, awsExport;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = (0, amplify_e2e_core_1.generateResourceIdsInOrder)(2), index1Id = _a[0], index2Id = _a[1];
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, {})];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addAuthWithDefault)(projRoot)];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addPlaceIndexWithDefault)(projRoot, { resourceName: index1Id, isFirstGeoResource: true })];
                case 3:
                    _b.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addPlaceIndexWithDefault)(projRoot, { resourceName: index2Id, isAdditional: true, isDefault: false })];
                case 4:
                    _b.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updatePlaceIndexWithDefault)(projRoot)];
                case 5:
                    _b.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushWithoutCodegen)(projRoot)];
                case 6:
                    _b.sent();
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    placeIndexName = meta.geo[index1Id].output.Name;
                    region = meta.geo[index1Id].output.Region;
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getPlaceIndex)(placeIndexName, region)];
                case 7:
                    placeIndex = _b.sent();
                    expect(placeIndex.IndexName).toBeDefined();
                    expect(meta.geo[index1Id].accessType).toBe('AuthorizedAndGuestUsers');
                    awsExport = (0, awsExports_1.getAWSExports)(projRoot).default;
                    expect((0, amplify_e2e_core_1.getGeoJSConfiguration)(awsExport).search_indices.items).toContain(placeIndexName);
                    expect((0, amplify_e2e_core_1.getGeoJSConfiguration)(awsExport).search_indices.default).toEqual(placeIndexName);
                    expect((0, amplify_e2e_core_1.getGeoJSConfiguration)(awsExport).region).toEqual(region);
                    return [2 /*return*/];
            }
        });
    }); });
    it('init a project with default auth config, add the geofence collection resource and update the auth config', function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a, collection1Id, collection2Id, cognitoGroups, meta, collectionName, region, collection, awsExport;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = (0, amplify_e2e_core_1.generateResourceIdsInOrder)(2), collection1Id = _a[0], collection2Id = _a[1];
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, {})];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addAuthWithDefault)(projRoot)];
                case 2:
                    _b.sent();
                    cognitoGroups = ['admin', 'admin1'];
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateAuthAddUserGroups)(projRoot, cognitoGroups)];
                case 3:
                    _b.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addGeofenceCollectionWithDefault)(projRoot, cognitoGroups, { resourceName: collection1Id })];
                case 4:
                    _b.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addGeofenceCollectionWithDefault)(projRoot, cognitoGroups, { resourceName: collection2Id, isAdditional: true, isDefault: false })];
                case 5:
                    _b.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateGeofenceCollectionWithDefault)(projRoot, cognitoGroups)];
                case 6:
                    _b.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushWithoutCodegen)(projRoot)];
                case 7:
                    _b.sent();
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    collectionName = meta.geo[collection1Id].output.Name;
                    region = meta.geo[collection1Id].output.Region;
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getGeofenceCollection)(collectionName, region)];
                case 8:
                    collection = _b.sent();
                    expect(collection.CollectionName).toBeDefined();
                    awsExport = (0, awsExports_1.getAWSExports)(projRoot).default;
                    expect((0, amplify_e2e_core_1.getGeoJSConfiguration)(awsExport).geofenceCollections.items).toContain(collectionName);
                    expect((0, amplify_e2e_core_1.getGeoJSConfiguration)(awsExport).geofenceCollections.default).toEqual(collectionName);
                    expect((0, amplify_e2e_core_1.getGeoJSConfiguration)(awsExport).region).toEqual(region);
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=geo-update-1.test.js.map