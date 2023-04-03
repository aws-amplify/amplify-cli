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
exports.expected_result_query = exports.query = exports.func = exports.schema = exports.runTest = void 0;
//special handling needed becasue we need to set up the function in a differnt region
var path_1 = __importDefault(require("path"));
var fs_extra_1 = __importDefault(require("fs-extra"));
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
var authHelper_1 = require("../authHelper");
var common_1 = require("../common");
var functionTester_1 = require("../functionTester");
function runTest(projectDir, testModule) {
    return __awaiter(this, void 0, void 0, function () {
        var functionRegion, functionProjectDirPath, functionName, awsconfig, apiKey, appSyncClient;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    functionRegion = process.env.CLI_REGION === 'us-west-2' ? 'us-east-2' : 'us-west-2';
                    functionProjectDirPath = path_1.default.join(path_1.default.dirname(projectDir), path_1.default.basename(projectDir) + '-function');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, , 6, 8]);
                    return [4 /*yield*/, setupFunction(functionProjectDirPath, functionRegion)];
                case 2:
                    functionName = _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addApi)(projectDir, { transformerVersion: 1 })];
                case 3:
                    _a.sent();
                    (0, common_1.updateSchemaInTestProject)(projectDir, testModule.schema);
                    updateFunctionNameAndRegionInSchema(projectDir, functionName, functionRegion);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPush)(projectDir)];
                case 4:
                    _a.sent();
                    awsconfig = (0, authHelper_1.configureAmplify)(projectDir);
                    apiKey = (0, authHelper_1.getApiKey)(projectDir);
                    appSyncClient = (0, authHelper_1.getConfiguredAppsyncClientAPIKeyAuth)(awsconfig.aws_appsync_graphqlEndpoint, awsconfig.aws_appsync_region, apiKey);
                    return [4 /*yield*/, (0, common_1.testQueries)(testModule, appSyncClient)];
                case 5:
                    _a.sent();
                    return [3 /*break*/, 8];
                case 6: return [4 /*yield*/, deleteFunctionProject(functionProjectDirPath)];
                case 7:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    });
}
exports.runTest = runTest;
function setupFunction(functionProjectDirPath, functionRegion) {
    return __awaiter(this, void 0, void 0, function () {
        var functionName, amplifyBackendDirPath, amplifyFunctionIndexFilePath, amplifyMeta;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    fs_extra_1.default.ensureDirSync(functionProjectDirPath);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initProjectWithAccessKey)(functionProjectDirPath, {
                            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                            region: functionRegion,
                        })];
                case 1:
                    _a.sent();
                    functionName = (0, functionTester_1.randomizedFunctionName)('function');
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(functionProjectDirPath, {
                            name: functionName,
                            functionTemplate: 'Hello World',
                        }, 'nodejs')];
                case 2:
                    _a.sent();
                    amplifyBackendDirPath = path_1.default.join(functionProjectDirPath, 'amplify', 'backend');
                    amplifyFunctionIndexFilePath = path_1.default.join(amplifyBackendDirPath, 'function', functionName, 'src', 'index.js');
                    fs_extra_1.default.writeFileSync(amplifyFunctionIndexFilePath, exports.func);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushWithoutCodegen)(functionProjectDirPath)];
                case 3:
                    _a.sent();
                    amplifyMeta = (0, amplify_e2e_core_1.getProjectMeta)(functionProjectDirPath);
                    //return the actual function name in the other region
                    return [2 /*return*/, amplifyMeta.function[functionName].output.Name];
            }
        });
    });
}
function deleteFunctionProject(functionProjectDirPath) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.deleteProject)(functionProjectDirPath)];
                case 1:
                    _a.sent();
                    (0, amplify_e2e_core_1.deleteProjectDir)(functionProjectDirPath);
                    return [2 /*return*/];
            }
        });
    });
}
function updateFunctionNameAndRegionInSchema(projectDir, functionName, functionRegion) {
    var backendApiDirPath = path_1.default.join(projectDir, 'amplify', 'backend', 'api');
    var apiResDirName = fs_extra_1.default.readdirSync(backendApiDirPath)[0];
    var amplifySchemaFilePath = path_1.default.join(backendApiDirPath, apiResDirName, 'schema.graphql');
    var amplifySchemaFileContents = fs_extra_1.default.readFileSync(amplifySchemaFilePath).toString();
    amplifySchemaFileContents = amplifySchemaFileContents.replace(/<function-name>/g, functionName);
    amplifySchemaFileContents = amplifySchemaFileContents.replace(/<function-region>/g, functionRegion);
    fs_extra_1.default.writeFileSync(amplifySchemaFilePath, amplifySchemaFileContents);
}
//schema
exports.schema = "\n#change: replace the dummy function name with  \"<function-name>\" placeholder, the test will replace it with the actual function name\n#change: replaced the dummy region \"us-east-1\" with the  \"<function-region>\" placeholder, the test will replace is with the actual region of the function\ntype Query {\n  echo(msg: String): String @function(name: \"<function-name>\", region: \"<function-region>\")\n}\n";
//functions
exports.func = "\n//#extra\n//create the lambda function in region other than the amplify project region\nexports.handler = async event => {\n  return event.arguments.msg;\n};\n";
//queries
exports.query = "\n#extra\nquery Echo {\n  echo(msg: \"query message echoed from different region.\")\n}\n";
exports.expected_result_query = {
    data: {
        echo: 'query message echoed from different region.',
    },
};
//# sourceMappingURL=function-differentRegion.js.map