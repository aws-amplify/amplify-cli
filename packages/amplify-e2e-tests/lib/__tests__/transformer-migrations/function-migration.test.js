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
var functionTester_1 = require("../../schema-api-directives/functionTester");
var common_1 = require("../../schema-api-directives/common");
var authHelper_1 = require("../../schema-api-directives/authHelper");
describe('api directives @function v1 to v2 migration', function () {
    var projectDir;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('function')];
                case 1:
                    projectDir = _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projectDir, {})];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    afterEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.deleteProject)(projectDir)];
                case 1:
                    _a.sent();
                    (0, amplify_e2e_core_1.deleteProjectDir)(projectDir);
                    return [2 /*return*/];
            }
        });
    }); });
    it('function directive migration testing', function () { return __awaiter(void 0, void 0, void 0, function () {
        var testModule, v1TransformerVersion, v2TransformerVersion, function1Name, function2Name, awsconfig, apiKey, appSyncClient;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    testModule = {
                        func1: func1,
                        func2: func2,
                        schema: schema,
                        query: query,
                        expected_result_query: expected_result_query,
                    };
                    v1TransformerVersion = 'v1';
                    v2TransformerVersion = 'v2';
                    return [4 /*yield*/, (0, functionTester_1.addSimpleFunction)(projectDir, testModule, 'func1')];
                case 1:
                    function1Name = _a.sent();
                    return [4 /*yield*/, (0, functionTester_1.addSimpleFunction)(projectDir, testModule, 'func2')];
                case 2:
                    function2Name = _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addApi)(projectDir, { transformerVersion: 1 })];
                case 3:
                    _a.sent();
                    (0, common_1.updateSchemaInTestProject)(projectDir, testModule.schema);
                    (0, functionTester_1.updateFunctionNameInSchema)(projectDir, '<function1-name>', function1Name);
                    (0, functionTester_1.updateFunctionNameInSchema)(projectDir, '<function2-name>', function2Name);
                    (0, functionTester_1.updateFunctionNameInSchema)(projectDir, '<transformer-version>', v1TransformerVersion);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPush)(projectDir)];
                case 4:
                    _a.sent();
                    awsconfig = (0, authHelper_1.configureAmplify)(projectDir);
                    apiKey = (0, authHelper_1.getApiKey)(projectDir);
                    appSyncClient = (0, authHelper_1.getConfiguredAppsyncClientAPIKeyAuth)(awsconfig.aws_appsync_graphqlEndpoint, awsconfig.aws_appsync_region, apiKey);
                    return [4 /*yield*/, (0, common_1.testQueries)(testModule, appSyncClient)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFeatureFlag)(projectDir, 'graphqltransformer', 'transformerVersion', 2)];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFeatureFlag)(projectDir, 'graphqltransformer', 'useExperimentalPipelinedTransformer', true)];
                case 7:
                    _a.sent();
                    (0, common_1.updateSchemaInTestProject)(projectDir, testModule.schema);
                    (0, functionTester_1.updateFunctionNameInSchema)(projectDir, '<function1-name>', function1Name);
                    (0, functionTester_1.updateFunctionNameInSchema)(projectDir, '<function2-name>', function2Name);
                    (0, functionTester_1.updateFunctionNameInSchema)(projectDir, '<transformer-version>', v2TransformerVersion);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushUpdate)(projectDir)];
                case 8:
                    _a.sent();
                    awsconfig = (0, authHelper_1.configureAmplify)(projectDir);
                    apiKey = (0, authHelper_1.getApiKey)(projectDir);
                    appSyncClient = (0, authHelper_1.getConfiguredAppsyncClientAPIKeyAuth)(awsconfig.aws_appsync_graphqlEndpoint, awsconfig.aws_appsync_region, apiKey);
                    return [4 /*yield*/, (0, common_1.testQueries)(testModule, appSyncClient)];
                case 9:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    // schema
    var env = '${env}';
    var schema = "\n    #Transformer Version: <transformer-version>\n    type Query {\n      doSomeWork(msg: String): String @function(name: \"<function1-name>-".concat(env, "\") @function(name: \"<function2-name>-").concat(env, "\")\n    }\n  ");
    // functions
    var func1 = "\n    exports.handler = async event => {\n      return event.arguments.msg + '|processed by worker-function';\n    };\n  ";
    var func2 = "\n    exports.handler = async event => {\n      return event.prev.result + '|processed by audit function';\n    };\n  ";
    // queries
    var query = "\n    query DoSomeWork {\n      doSomeWork(msg: \"initial mutation message\")\n    }\n  ";
    var expected_result_query = {
        data: {
            doSomeWork: 'initial mutation message|processed by worker-function|processed by audit function',
        },
    };
});
//# sourceMappingURL=function-migration.test.js.map