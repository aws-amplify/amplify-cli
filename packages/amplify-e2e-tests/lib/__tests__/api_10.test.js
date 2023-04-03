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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable */
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
var fs_1 = require("fs");
var lodash_1 = __importDefault(require("lodash"));
var path = __importStar(require("path"));
var providerName = 'awscloudformation';
// to deal with bug in cognito-identity-js
global.fetch = require('node-fetch');
// to deal with subscriptions in node env
global.WebSocket = require('ws');
describe('amplify add api (GraphQL)', function () {
    var projRoot;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('graphql-api')];
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
                    metaFilePath = path.join(projRoot, 'amplify', '#current-cloud-backend', 'amplify-meta.json');
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
    it('init a datastore enabled project and then remove datastore config in update', function () { return __awaiter(void 0, void 0, void 0, function () {
        var name, meta, output, GraphQLAPIIdOutput, GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput, graphqlApi, withoutDSConfig, transformConfigWithDS;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    name = 'withoutdatastore';
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, { name: name })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addApiWithoutSchema)(projRoot, { transformerVersion: 1 })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateApiSchema)(projRoot, name, 'simple_model.graphql')];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPush)(projRoot)];
                case 4:
                    _a.sent();
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    output = meta.api[name].output;
                    GraphQLAPIIdOutput = output.GraphQLAPIIdOutput, GraphQLAPIEndpointOutput = output.GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput = output.GraphQLAPIKeyOutput;
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getAppSyncApi)(GraphQLAPIIdOutput, meta.providers.awscloudformation.Region)];
                case 5:
                    graphqlApi = (_a.sent()).graphqlApi;
                    expect(GraphQLAPIIdOutput).toBeDefined();
                    expect(GraphQLAPIEndpointOutput).toBeDefined();
                    expect(GraphQLAPIKeyOutput).toBeDefined();
                    expect(graphqlApi).toBeDefined();
                    expect(graphqlApi.apiId).toEqual(GraphQLAPIIdOutput);
                    withoutDSConfig = (0, amplify_e2e_core_1.getTransformConfig)(projRoot, name);
                    expect(withoutDSConfig).toBeDefined();
                    expect(lodash_1.default.isEmpty(withoutDSConfig.ResolverConfig)).toBe(true);
                    // amplify update api to enable datastore
                    return [4 /*yield*/, (0, amplify_e2e_core_1.apiEnableDataStore)(projRoot, {})];
                case 6:
                    // amplify update api to enable datastore
                    _a.sent();
                    transformConfigWithDS = (0, amplify_e2e_core_1.getTransformConfig)(projRoot, name);
                    expect(transformConfigWithDS).toBeDefined();
                    expect(transformConfigWithDS.ResolverConfig).toBeDefined();
                    expect(transformConfigWithDS.ResolverConfig.project).toBeDefined();
                    expect(transformConfigWithDS.ResolverConfig.project.ConflictHandler).toEqual('AUTOMERGE');
                    expect(transformConfigWithDS.ResolverConfig.project.ConflictDetection).toEqual('VERSION');
                    return [2 /*return*/];
            }
        });
    }); });
    it('init a project and add custom iam roles - local test with gql v2', function () { return __awaiter(void 0, void 0, void 0, function () {
        var name, createResolver, beforeAdminConfig, customRolesConfig, afterAdminConfig;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    name = 'customadminroles';
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, { name: name })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addApi)(projRoot, { transformerVersion: 2, IAM: {}, 'Amazon Cognito User Pool': {} })];
                case 2:
                    _a.sent();
                    (0, amplify_e2e_core_1.updateApiSchema)(projRoot, name, 'cognito_simple_model.graphql');
                    return [4 /*yield*/, (0, amplify_e2e_core_1.apiGqlCompile)(projRoot)];
                case 3:
                    _a.sent();
                    createResolver = path.join(projRoot, 'amplify', 'backend', 'api', name, 'build', 'resolvers', 'Mutation.createTodo.auth.1.req.vtl');
                    beforeAdminConfig = (0, fs_1.readFileSync)(createResolver).toString();
                    expect(beforeAdminConfig).toMatchSnapshot();
                    customRolesConfig = {
                        adminRoleNames: ['myAdminRoleName'],
                    };
                    (0, amplify_e2e_core_1.setCustomRolesConfig)(projRoot, name, customRolesConfig);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.apiGqlCompile)(projRoot)];
                case 4:
                    _a.sent();
                    afterAdminConfig = (0, fs_1.readFileSync)(createResolver).toString();
                    expect(afterAdminConfig).toMatchSnapshot();
                    expect(beforeAdminConfig).not.toEqual(afterAdminConfig);
                    return [2 /*return*/];
            }
        });
    }); });
    it('init a project and add custom iam roles - local test with gql v2 w/ identity claim feature flag disabled', function () { return __awaiter(void 0, void 0, void 0, function () {
        var name, createResolver, beforeAdminConfig, customRolesConfig, afterAdminConfig;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    name = 'customadminroles';
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, { name: name })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFeatureFlag)(projRoot, 'graphqltransformer', 'useSubUsernameForDefaultIdentityClaim', false)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addApi)(projRoot, { transformerVersion: 2, IAM: {}, 'Amazon Cognito User Pool': {} })];
                case 3:
                    _a.sent();
                    (0, amplify_e2e_core_1.updateApiSchema)(projRoot, name, 'cognito_simple_model.graphql');
                    return [4 /*yield*/, (0, amplify_e2e_core_1.apiGqlCompile)(projRoot)];
                case 4:
                    _a.sent();
                    createResolver = path.join(projRoot, 'amplify', 'backend', 'api', name, 'build', 'resolvers', 'Mutation.createTodo.auth.1.req.vtl');
                    beforeAdminConfig = (0, fs_1.readFileSync)(createResolver).toString();
                    expect(beforeAdminConfig).toMatchSnapshot();
                    customRolesConfig = {
                        adminRoleNames: ['myAdminRoleName'],
                    };
                    (0, amplify_e2e_core_1.setCustomRolesConfig)(projRoot, name, customRolesConfig);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.apiGqlCompile)(projRoot)];
                case 5:
                    _a.sent();
                    afterAdminConfig = (0, fs_1.readFileSync)(createResolver).toString();
                    expect(afterAdminConfig).toMatchSnapshot();
                    expect(beforeAdminConfig).not.toEqual(afterAdminConfig);
                    return [2 /*return*/];
            }
        });
    }); });
    // TODO: Disabling for now until further conversation.
    // it('inits a project with a simple model with deletion protection enabled and then migrates the api', async () => {
    //   const projectName = 'retaintables';
    //   const initialSchema = 'simple_model.graphql';
    //   console.log(projRoot);
    //   await initJSProjectWithProfile(projRoot, { name: projectName });
    //   await addApiWithSchema(projRoot, initialSchema);
    //   updateConfig(projRoot, projectName, {
    //     TransformerOptions: {
    //       '@model': { EnableDeletionProtection: true }
    //     }
    //   });
    //   await amplifyPush(projRoot);
    //   const projectMeta = getProjectMeta(projRoot);
    //   const region = projectMeta.providers.awscloudformation.Region;
    //   const { output } = projectMeta.api[projectName];
    //   const { GraphQLAPIIdOutput, GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput } = output;
    //   await expect(GraphQLAPIIdOutput).toBeDefined()
    //   await expect(GraphQLAPIEndpointOutput).toBeDefined()
    //   await expect(GraphQLAPIKeyOutput).toBeDefined()
    //   await deleteProject(projRoot);
    //   const tableName = `Todo-${GraphQLAPIIdOutput}-integtest`;
    //   const table = await getTable(tableName, region);
    //   expect(table.Table).toBeDefined()
    //   if (table.Table) {
    //     const del = await deleteTable(tableName, region);
    //     expect(del.TableDescription).toBeDefined()
    //   }
    // });
});
/* eslint-enable */
//# sourceMappingURL=api_10.test.js.map