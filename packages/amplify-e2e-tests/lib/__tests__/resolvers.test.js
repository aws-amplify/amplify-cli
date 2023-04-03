"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
var path_1 = require("path");
var fs = __importStar(require("fs-extra"));
describe('user created resolvers', function () {
    var projectDir;
    var apiName = 'simpleapi';
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('overrideresolvers')];
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
    describe('overriding generated resolvers', function () {
        it('adds the overwritten resolver to the build', function () { return __awaiter(void 0, void 0, void 0, function () {
            var resolverName, resolver, generatedResolverPath;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        resolverName = 'Query.listTodos.req.vtl';
                        resolver = '$util.unauthorized()';
                        generatedResolverPath = (0, path_1.join)(projectDir, 'amplify', 'backend', 'api', apiName, 'build', 'resolvers', resolverName);
                        return [4 /*yield*/, (0, amplify_e2e_core_1.addApiWithoutSchema)(projectDir, { apiName: apiName })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, (0, amplify_e2e_core_1.updateApiSchema)(projectDir, apiName, 'simple_model.graphql')];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, (0, amplify_e2e_core_1.apiGqlCompile)(projectDir, true)];
                    case 3:
                        _a.sent();
                        expect(fs.readFileSync(generatedResolverPath).toString()).not.toEqual(resolver);
                        (0, amplify_e2e_core_1.addCustomResolver)(projectDir, apiName, resolverName, resolver);
                        return [4 /*yield*/, (0, amplify_e2e_core_1.apiGqlCompile)(projectDir, true)];
                    case 4:
                        _a.sent();
                        expect(fs.readFileSync(generatedResolverPath).toString()).toEqual(resolver);
                        return [2 /*return*/];
                }
            });
        }); });
        it('overriding a resolver should not create duplicate function', function () { return __awaiter(void 0, void 0, void 0, function () {
            var slotName, slot, generatedResolverPath, overriddenResolverPath, todoJsonPath, todoJson, getResolverAppsyncFunctions, listResolverAppsyncFunctions, filterFunctions;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        slotName = 'Query.listTodos.auth.1.req.vtl';
                        slot = '$util.unauthorized()';
                        generatedResolverPath = (0, path_1.join)(projectDir, 'amplify', 'backend', 'api', apiName, 'build', 'resolvers', slotName);
                        overriddenResolverPath = (0, path_1.join)(projectDir, 'amplify', 'backend', 'api', apiName, 'resolvers', slotName);
                        return [4 /*yield*/, (0, amplify_e2e_core_1.addApiWithoutSchema)(projectDir, { apiName: apiName })];
                    case 1:
                        _a.sent();
                        (0, amplify_e2e_core_1.updateApiSchema)(projectDir, apiName, 'cognito_simple_model.graphql');
                        return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushGraphQlWithCognitoPrompt)(projectDir)];
                    case 2:
                        _a.sent();
                        expect(fs.existsSync(generatedResolverPath)).toEqual(true);
                        (0, amplify_e2e_core_1.addCustomResolver)(projectDir, apiName, slotName, slot);
                        return [4 /*yield*/, (0, amplify_e2e_core_1.generateModels)(projectDir)];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushUpdate)(projectDir)];
                    case 4:
                        _a.sent();
                        todoJsonPath = (0, path_1.join)(projectDir, 'amplify', 'backend', 'api', apiName, 'build', 'stacks', 'Todo.json');
                        todoJson = JSON.parse(fs.readFileSync(todoJsonPath).toString());
                        expect(fs.readFileSync(generatedResolverPath).toString()).toEqual(slot);
                        expect(fs.readFileSync(overriddenResolverPath).toString()).toEqual(slot);
                        getResolverAppsyncFunctions = todoJson.Resources.GetTodoResolver.Properties.PipelineConfig.Functions;
                        listResolverAppsyncFunctions = todoJson.Resources.ListTodoResolver.Properties.PipelineConfig.Functions;
                        expect(getResolverAppsyncFunctions).toHaveLength(3);
                        // The function count should be 3 even after overriding the auth resolver
                        expect(listResolverAppsyncFunctions).toHaveLength(3);
                        filterFunctions = listResolverAppsyncFunctions.filter(function (func1) {
                            return getResolverAppsyncFunctions.some(function (func2) { return func1['Fn::GetAtt'][0] === func2['Fn::GetAtt'][0]; });
                        });
                        expect(filterFunctions).toMatchInlineSnapshot("\n        Array [\n          Object {\n            \"Fn::GetAtt\": Array [\n              \"QuerygetTodopostAuth0FunctionQuerygetTodopostAuth0FunctionAppSyncFunction6BE14593\",\n              \"FunctionId\",\n            ],\n          },\n        ]\n      ");
                        expect(listResolverAppsyncFunctions.filter(function (obj) { return obj['Fn::GetAtt'][0].includes('QuerylistTodosauth0Function'); }))
                            .toMatchInlineSnapshot("\n        Array [\n          Object {\n            \"Fn::GetAtt\": Array [\n              \"QuerylistTodosauth0FunctionQuerylistTodosauth0FunctionAppSyncFunction7D761961\",\n              \"FunctionId\",\n            ],\n          },\n        ]\n      ");
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('adding user defined slots', function () {
        it('adds the slot to the project and uploads the function to AppSync', function () { return __awaiter(void 0, void 0, void 0, function () {
            var slotName, slot, generatedResolverPath, todoJsonPath, todoJson;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        slotName = 'Query.listTodos.postAuth.2.req.vtl';
                        slot = '$util.unauthorized()';
                        generatedResolverPath = (0, path_1.join)(projectDir, 'amplify', 'backend', 'api', apiName, 'build', 'resolvers', slotName);
                        return [4 /*yield*/, (0, amplify_e2e_core_1.addApiWithoutSchema)(projectDir, { apiName: apiName })];
                    case 1:
                        _a.sent();
                        (0, amplify_e2e_core_1.updateApiSchema)(projectDir, apiName, 'model_with_sandbox_mode.graphql');
                        return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPush)(projectDir)];
                    case 2:
                        _a.sent();
                        expect(fs.existsSync(generatedResolverPath)).toEqual(false);
                        (0, amplify_e2e_core_1.addCustomResolver)(projectDir, apiName, slotName, slot);
                        return [4 /*yield*/, (0, amplify_e2e_core_1.generateModels)(projectDir)];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushUpdate)(projectDir)];
                    case 4:
                        _a.sent();
                        todoJsonPath = (0, path_1.join)(projectDir, 'amplify', 'backend', 'api', apiName, 'build', 'stacks', 'Todo.json');
                        todoJson = JSON.parse(fs.readFileSync(todoJsonPath).toString());
                        expect(fs.readFileSync(generatedResolverPath).toString()).toEqual(slot);
                        expect(todoJson.Resources.GetTodoResolver.Properties.PipelineConfig.Functions).toHaveLength(2);
                        expect(todoJson.Resources.ListTodoResolver.Properties.PipelineConfig.Functions).toHaveLength(3);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('custom resolvers', function () {
        it('adds the overwritten resolver to the build', function () { return __awaiter(void 0, void 0, void 0, function () {
            var resolverReqName, resolverResName, resolverReq, resolverRes, generatedReqResolverPath, generatedResResolverPath, stackPath, Resources;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        resolverReqName = 'Query.commentsForTodo.req.vtl';
                        resolverResName = 'Query.commentsForTodo.res.vtl';
                        resolverReq = '$util.unauthorized()';
                        resolverRes = '$util.toJson({})';
                        generatedReqResolverPath = (0, path_1.join)(projectDir, 'amplify', 'backend', 'api', apiName, 'build', 'resolvers', resolverReqName);
                        generatedResResolverPath = (0, path_1.join)(projectDir, 'amplify', 'backend', 'api', apiName, 'build', 'resolvers', resolverResName);
                        stackPath = (0, path_1.join)(projectDir, 'amplify', 'backend', 'api', apiName, 'build', 'stacks', 'CustomResources.json');
                        Resources = {
                            Resources: {
                                QueryCommentsForTodoResolver: {
                                    Type: 'AWS::AppSync::Resolver',
                                    Properties: {
                                        ApiId: {
                                            Ref: 'AppSyncApiId',
                                        },
                                        DataSourceName: 'CommentTable',
                                        TypeName: 'Query',
                                        FieldName: 'commentsForTodo',
                                        RequestMappingTemplateS3Location: {
                                            'Fn::Sub': [
                                                's3://${S3DeploymentBucket}/${S3DeploymentRootKey}/resolvers/Query.commentsForTodo.req.vtl',
                                                {
                                                    S3DeploymentBucket: {
                                                        Ref: 'S3DeploymentBucket',
                                                    },
                                                    S3DeploymentRootKey: {
                                                        Ref: 'S3DeploymentRootKey',
                                                    },
                                                },
                                            ],
                                        },
                                        ResponseMappingTemplateS3Location: {
                                            'Fn::Sub': [
                                                's3://${S3DeploymentBucket}/${S3DeploymentRootKey}/resolvers/Query.commentsForTodo.res.vtl',
                                                {
                                                    S3DeploymentBucket: {
                                                        Ref: 'S3DeploymentBucket',
                                                    },
                                                    S3DeploymentRootKey: {
                                                        Ref: 'S3DeploymentRootKey',
                                                    },
                                                },
                                            ],
                                        },
                                    },
                                },
                            },
                        };
                        return [4 /*yield*/, (0, amplify_e2e_core_1.addApiWithoutSchema)(projectDir, { apiName: apiName })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, (0, amplify_e2e_core_1.updateApiSchema)(projectDir, apiName, 'custom_query.graphql')];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, (0, amplify_e2e_core_1.apiGqlCompile)(projectDir, true)];
                    case 3:
                        _a.sent();
                        (0, amplify_e2e_core_1.addCustomResolver)(projectDir, apiName, resolverReqName, resolverReq);
                        (0, amplify_e2e_core_1.addCustomResolver)(projectDir, apiName, resolverResName, resolverRes);
                        (0, amplify_e2e_core_1.writeToCustomResourcesJson)(projectDir, apiName, Resources);
                        return [4 /*yield*/, (0, amplify_e2e_core_1.apiGqlCompile)(projectDir, true)];
                    case 4:
                        _a.sent();
                        expect(fs.readFileSync(generatedReqResolverPath).toString()).toEqual(resolverReq);
                        expect(fs.readFileSync(generatedResResolverPath).toString()).toEqual(resolverRes);
                        expect(JSON.parse(fs.readFileSync(stackPath).toString()).Resources).toEqual(Resources.Resources);
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
//# sourceMappingURL=resolvers.test.js.map