"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
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
var aws_sdk_1 = require("aws-sdk");
var graphql_transformer_common_1 = require("graphql-transformer-common");
function promisify(fun, args, that) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, new Promise(function (resolve, reject) {
                        fun.apply(that, [
                            args,
                            function (err, data) {
                                if (err) {
                                    return reject(err);
                                }
                                resolve(data);
                            }
                        ]);
                    })];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
var CloudFormationClient = /** @class */ (function () {
    function CloudFormationClient(region) {
        this.region = region;
        this.client = new aws_sdk_1.CloudFormation({ apiVersion: '2010-05-15', region: this.region });
    }
    CloudFormationClient.prototype.createStack = function (template, name, upArn) {
        return __awaiter(this, void 0, void 0, function () {
            var params;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = [
                            {
                                ParameterKey: graphql_transformer_common_1.ResourceConstants.PARAMETERS.AppSyncApiName,
                                ParameterValue: name
                            },
                            {
                                ParameterKey: graphql_transformer_common_1.ResourceConstants.PARAMETERS.DynamoDBModelTableName,
                                ParameterValue: name + 'Table'
                            },
                            {
                                ParameterKey: graphql_transformer_common_1.ResourceConstants.PARAMETERS.DynamoDBModelTableAccessIAMRoleName,
                                ParameterValue: name + 'Role'
                            }
                        ];
                        if (upArn) {
                            console.log("Setting User Pool Arn: " + upArn + ".");
                            params.push({
                                ParameterKey: graphql_transformer_common_1.ResourceConstants.PARAMETERS.AuthCognitoUserPoolId,
                                ParameterValue: upArn
                            });
                        }
                        return [4 /*yield*/, promisify(this.client.createStack, {
                                StackName: name,
                                Capabilities: ['CAPABILITY_NAMED_IAM'],
                                Parameters: params,
                                TemplateBody: JSON.stringify(template)
                            }, this.client)];
                    case 1: 
                    // const paramOverrides = Object.keys(params).map((k: string) => `${k}=${params[k]}`).join(' ')
                    return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    CloudFormationClient.prototype.deleteStack = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, promisify(this.client.deleteStack, { StackName: name }, this.client)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    CloudFormationClient.prototype.describeStack = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, new Promise(function (resolve, reject) {
                            _this.client.describeStacks({
                                StackName: name
                            }, function (err, data) {
                                if (err) {
                                    return reject(err);
                                }
                                if (data.Stacks.length !== 1) {
                                    return reject("No stack named: " + name);
                                }
                                resolve(data.Stacks[0]);
                            });
                        })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Periodically polls a stack waiting for a status change. If the status
     * changes to success then this resolves if it changes to error then it rejects.
     * @param name: The stack name to wait for
     * @param success: The status' that indicate success.
     * @param failure: The status' that indicate failure.
     * @param poll: The status' that indicate to keep polling.
     * @param maxPolls: The max number of times to poll.
     * @param pollInterval: The frequency of polling.
     */
    CloudFormationClient.prototype.waitForStack = function (name, success, failure, poll, maxPolls, pollInterval) {
        if (success === void 0) { success = ["CREATE_COMPLETE", "ROLLBACK_COMPLETE", "DELETE_COMPLETE", "UPDATE_COMPLETE", "UPDATE_ROLLBACK_COMPLETE"]; }
        if (failure === void 0) { failure = ["CREATE_FAILED", "ROLLBACK_FAILED", "DELETE_FAILED", "UPDATE_ROLLBACK_FAILED"]; }
        if (poll === void 0) { poll = [
            "CREATE_IN_PROGRESS", "ROLLBACK_IN_PROGRESS", "UPDATE_IN_PROGRESS", "REVIEW_IN_PROGRESS", "DELETE_IN_PROGRESS",
            "UPDATE_COMPLETE_CLEANUP_IN_PROGRESS", "UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS", "UPDATE_ROLLBACK_IN_PROGRESS"
        ]; }
        if (maxPolls === void 0) { maxPolls = 100; }
        if (pollInterval === void 0) { pollInterval = 5; }
        return __awaiter(this, void 0, void 0, function () {
            var stack;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.describeStack(name)];
                    case 1:
                        stack = _a.sent();
                        if (!success.includes(stack.StackStatus)) return [3 /*break*/, 2];
                        return [2 /*return*/, Promise.resolve(stack)];
                    case 2:
                        if (!failure.includes(stack.StackStatus)) return [3 /*break*/, 3];
                        return [2 /*return*/, Promise.reject(new Error("Stack " + stack.StackName + " failed with status \"" + stack.StackStatus + "\""))];
                    case 3:
                        if (!poll.includes(stack.StackStatus)) return [3 /*break*/, 6];
                        if (!(maxPolls === 0)) return [3 /*break*/, 4];
                        return [2 /*return*/, Promise.reject(new Error("Stack did not finish before hitting the max poll count."))];
                    case 4: return [4 /*yield*/, this.wait(pollInterval, this.waitForStack, name, success, failure, poll, maxPolls - 1, pollInterval)];
                    case 5: return [2 /*return*/, _a.sent()];
                    case 6: return [2 /*return*/, Promise.reject(new Error('Invalid stack status: ' + stack.StackStatus))];
                }
            });
        });
    };
    /**
     * Promise wrapper around setTimeout.
     * @param secs The number of seconds to wait.
     * @param fun The function to call after waiting.
     * @param args The arguments to pass to the function after the wait.
     */
    CloudFormationClient.prototype.wait = function (secs, fun) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve) {
                        setTimeout(function () {
                            resolve(fun.apply(_this, args));
                        }, 1000 * secs);
                    })];
            });
        });
    };
    return CloudFormationClient;
}());
exports.CloudFormationClient = CloudFormationClient;
//# sourceMappingURL=CloudFormationClient.js.map