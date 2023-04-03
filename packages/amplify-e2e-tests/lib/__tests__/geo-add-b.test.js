"use strict";
/* eslint-disable spellcheck/spell-checker */
/* eslint-disable import/no-extraneous-dependencies */
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
var lodash_1 = __importDefault(require("lodash"));
var awsExports_1 = require("../aws-exports/awsExports");
describe('amplify geo add b', function () {
    var projRoot;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('geo-add-test')];
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
    it('init a project with default auth config and add the place index resource', function () { return __awaiter(void 0, void 0, void 0, function () {
        var meta, placeIndexId, indexName, region, placeIndex, awsExport;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, {})];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addAuthWithDefault)(projRoot)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addPlaceIndexWithDefault)(projRoot, { isFirstGeoResource: true })];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushWithoutCodegen)(projRoot)];
                case 4:
                    _a.sent();
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    expect(meta.geo).toBeDefined();
                    placeIndexId = lodash_1.default.findKey(meta.geo, ['service', 'PlaceIndex']);
                    indexName = meta.geo[placeIndexId].output.Name;
                    region = meta.geo[placeIndexId].output.Region;
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getPlaceIndex)(indexName, region)];
                case 5:
                    placeIndex = _a.sent();
                    awsExport = (0, awsExports_1.getAWSExports)(projRoot).default;
                    expect(placeIndex.IndexName).toBeDefined();
                    expect((0, amplify_e2e_core_1.getGeoJSConfiguration)(awsExport).search_indices.items).toContain(indexName);
                    expect((0, amplify_e2e_core_1.getGeoJSConfiguration)(awsExport).search_indices.default).toEqual(indexName);
                    expect((0, amplify_e2e_core_1.getGeoJSConfiguration)(awsExport).region).toEqual(region);
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=geo-add-b.test.js.map