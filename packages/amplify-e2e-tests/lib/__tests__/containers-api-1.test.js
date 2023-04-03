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
var node_fetch_1 = __importDefault(require("node-fetch"));
var awsExports_1 = require("../aws-exports/awsExports");
var setupAmplifyProject = function (cwd) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyConfigureProject)({
                    cwd: cwd,
                    enableContainers: true,
                })];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
describe('amplify api add', function () {
    var projRoot;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('containers')];
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
    it('init project, enable containers and add multi-container api', function () { return __awaiter(void 0, void 0, void 0, function () {
        var envName, apiName, awsExports, _a, name, endpoint, url, expected, result;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    envName = 'devtest';
                    apiName = "containersimpletest".concat((0, amplify_e2e_core_1.generateRandomShortId)());
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, { name: "multict".concat((0, amplify_e2e_core_1.generateRandomShortId)()), envName: envName })];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, setupAmplifyProject(projRoot)];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addRestContainerApi)(projRoot, { apiName: apiName })];
                case 3:
                    _b.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushWithoutCodegen)(projRoot)];
                case 4:
                    _b.sent();
                    awsExports = (0, awsExports_1.getAWSExports)(projRoot).default;
                    _a = awsExports.aws_cloud_logic_custom[0], name = _a.name, endpoint = _a.endpoint;
                    expect(name).toBeDefined();
                    expect(endpoint).toBeDefined();
                    url = "".concat(endpoint, "/images");
                    expected = 'Processing images...';
                    return [4 /*yield*/, (0, amplify_e2e_core_1.retry)(function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, (0, node_fetch_1.default)(url)];
                                case 1: return [2 /*return*/, (_a.sent()).text()];
                            }
                        }); }); }, function (fetchResult) { return fetchResult === expected; }, {
                            times: 100,
                            delayMS: 100,
                            // five minutes
                            timeoutMS: 300000,
                            stopOnError: false,
                        })];
                case 5:
                    result = _b.sent();
                    expect(result).toEqual(expected);
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=containers-api-1.test.js.map