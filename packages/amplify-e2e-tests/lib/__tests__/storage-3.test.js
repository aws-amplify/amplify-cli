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
describe('amplify add/update storage(DDB)', function () {
    var projRoot;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('ddb-add-update')];
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
    it('init a project and add/update ddb table with & without trigger', function () { return __awaiter(void 0, void 0, void 0, function () {
        var meta, _a, table1Name, table1Arn, table1Region, table1StreamArn, table1Configs, _b, table2Name, table2Arn, table2Region, table2StreamArn, table2Configs;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, {})];
                case 1:
                    _c.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addSimpleDDB)(projRoot, {})];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addDDBWithTrigger)(projRoot, {})];
                case 3:
                    _c.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                case 4:
                    _c.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateDDBWithTrigger)(projRoot, {})];
                case 5:
                    _c.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                case 6:
                    _c.sent();
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    _a = Object.keys(meta.storage).map(function (key) { return meta.storage[key]; })[0].output, table1Name = _a.Name, table1Arn = _a.Arn, table1Region = _a.Region, table1StreamArn = _a.StreamArn;
                    expect(table1Name).toBeDefined();
                    expect(table1Arn).toBeDefined();
                    expect(table1Region).toBeDefined();
                    expect(table1StreamArn).toBeDefined();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getDDBTable)(table1Name, table1Region)];
                case 7:
                    table1Configs = _c.sent();
                    expect(table1Configs.Table.TableArn).toEqual(table1Arn);
                    _b = Object.keys(meta.storage).map(function (key) { return meta.storage[key]; })[1].output, table2Name = _b.Name, table2Arn = _b.Arn, table2Region = _b.Region, table2StreamArn = _b.StreamArn;
                    expect(table2Name).toBeDefined();
                    expect(table2Arn).toBeDefined();
                    expect(table2Region).toBeDefined();
                    expect(table2StreamArn).toBeDefined();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getDDBTable)(table2Name, table2Region)];
                case 8:
                    table2Configs = _c.sent();
                    expect(table2Configs.Table.TableArn).toEqual(table2Arn);
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=storage-3.test.js.map