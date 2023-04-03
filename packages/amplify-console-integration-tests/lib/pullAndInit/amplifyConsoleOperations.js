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
exports.createBackendEnvironment = exports.deleteConsoleApp = exports.createConsoleApp = exports.generateBackendEnvParams = exports.deleteAmplifyStack = exports.deleteAllAmplifyProjects = exports.getConfiguredCFNClient = exports.getConfiguredAmplifyClient = void 0;
var aws_sdk_1 = require("aws-sdk");
var moment_1 = __importDefault(require("moment"));
var profile_helper_1 = require("../profile-helper");
function getConfiguredAmplifyClient() {
    var config = (0, profile_helper_1.getConfigFromProfile)();
    return new aws_sdk_1.Amplify(config);
}
exports.getConfiguredAmplifyClient = getConfiguredAmplifyClient;
function getConfiguredCFNClient() {
    var config = (0, profile_helper_1.getConfigFromProfile)();
    return new aws_sdk_1.CloudFormation(config);
}
exports.getConfiguredCFNClient = getConfiguredCFNClient;
//delete all existing amplify console projects
function deleteAllAmplifyProjects(amplifyClient) {
    return __awaiter(this, void 0, void 0, function () {
        var token;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!amplifyClient) {
                        amplifyClient = getConfiguredAmplifyClient();
                    }
                    _a.label = 1;
                case 1: return [4 /*yield*/, PaginatedDeleteProjects(amplifyClient, token)];
                case 2:
                    token = _a.sent();
                    _a.label = 3;
                case 3:
                    if (token) return [3 /*break*/, 1];
                    _a.label = 4;
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.deleteAllAmplifyProjects = deleteAllAmplifyProjects;
function deleteAmplifyStack(stackName, cfnClient) {
    return __awaiter(this, void 0, void 0, function () {
        var err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!cfnClient)
                        cfnClient = getConfiguredCFNClient();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, cfnClient.deleteStack({ StackName: stackName }).promise()];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.deleteAmplifyStack = deleteAmplifyStack;
function PaginatedDeleteProjects(amplifyClient, token) {
    return __awaiter(this, void 0, void 0, function () {
        var sequential, maxResults, listAppsResult, deleteTasks;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    sequential = require('promise-sequential');
                    maxResults = '25';
                    return [4 /*yield*/, amplifyClient
                            .listApps({
                            maxResults: maxResults,
                            nextToken: token,
                        })
                            .promise()];
                case 1:
                    listAppsResult = _a.sent();
                    deleteTasks = [];
                    listAppsResult.apps.forEach(function (app) {
                        deleteTasks.push(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, amplifyClient.deleteApp({ appId: app.appId }).promise()];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                    });
                    return [4 /*yield*/, sequential(deleteTasks)];
                case 2:
                    _a.sent();
                    return [2 /*return*/, listAppsResult.nextToken];
            }
        });
    });
}
function generateBackendEnvParams(appId, projectName, envName) {
    var timeStamp = (0, moment_1.default)().format('YYMMDDHHmm');
    var stackName = "amplify-".concat(projectName, "-").concat(envName, "-").concat(timeStamp);
    var deploymentBucketName = "".concat(stackName, "-deployment");
    return { appId: appId, envName: envName, stackName: stackName, deploymentBucketName: deploymentBucketName };
}
exports.generateBackendEnvParams = generateBackendEnvParams;
function createConsoleApp(projectName, amplifyClient) {
    return __awaiter(this, void 0, void 0, function () {
        var createAppParams, createAppResponse;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!amplifyClient) {
                        amplifyClient = getConfiguredAmplifyClient();
                    }
                    createAppParams = {
                        name: projectName,
                        environmentVariables: { _LIVE_PACKAGE_UPDATES: '[{"pkg":"@aws-amplify/cli","type":"npm","version":"latest"}]' },
                    };
                    return [4 /*yield*/, amplifyClient.createApp(createAppParams).promise()];
                case 1:
                    createAppResponse = _a.sent();
                    return [2 /*return*/, createAppResponse.app.appId];
            }
        });
    });
}
exports.createConsoleApp = createConsoleApp;
function deleteConsoleApp(appId, amplifyClient) {
    return __awaiter(this, void 0, void 0, function () {
        var deleteAppParams, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!amplifyClient) {
                        amplifyClient = getConfiguredAmplifyClient();
                    }
                    deleteAppParams = {
                        appId: appId,
                    };
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, amplifyClient.deleteApp(deleteAppParams).promise()];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_2 = _a.sent();
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.deleteConsoleApp = deleteConsoleApp;
function createBackendEnvironment(backendParams, amplifyClient) {
    return __awaiter(this, void 0, void 0, function () {
        var appId, envName, stackName, deploymentBucketName, createEnvParams;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!amplifyClient) {
                        amplifyClient = getConfiguredAmplifyClient();
                    }
                    appId = backendParams.appId, envName = backendParams.envName, stackName = backendParams.stackName, deploymentBucketName = backendParams.deploymentBucketName;
                    createEnvParams = {
                        appId: appId,
                        environmentName: envName,
                        stackName: stackName,
                        deploymentArtifacts: deploymentBucketName,
                    };
                    return [4 /*yield*/, amplifyClient.createBackendEnvironment(createEnvParams).promise()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.createBackendEnvironment = createBackendEnvironment;
//# sourceMappingURL=amplifyConsoleOperations.js.map