"use strict";
/* eslint-disable spellcheck/spell-checker */
/* eslint-disable import/no-extraneous-dependencies */
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
Object.defineProperty(exports, "__esModule", { value: true });
const amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
const fs = __importStar(require("fs-extra"));
const graphql_transformer_core_1 = require("graphql-transformer-core");
const path_1 = require("path");
const migration_helpers_1 = require("../../../migration-helpers");
describe('api migration update test c', () => {
    let projRoot;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        projRoot = yield (0, amplify_e2e_core_1.createNewProjectDir)('graphql-api');
    }));
    afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
        const metaFilePath = (0, path_1.join)(projRoot, 'amplify', '#current-cloud-backend', 'amplify-meta.json');
        if (fs.existsSync(metaFilePath)) {
            yield (0, amplify_e2e_core_1.deleteProject)(projRoot, undefined, true);
        }
        (0, amplify_e2e_core_1.deleteProjectDir)(projRoot);
    }));
    it('init a sync enabled project and update conflict resolution strategy', () => __awaiter(void 0, void 0, void 0, function* () {
        const name = `syncenabled`;
        // init and add api with locally installed cli
        yield (0, migration_helpers_1.initJSProjectWithProfileV4_52_0)(projRoot, { name });
        yield (0, migration_helpers_1.addApiWithSchemaAndConflictDetectionOldDx)(projRoot, 'simple_model.graphql');
        yield (0, amplify_e2e_core_1.amplifyPushLegacy)(projRoot);
        let transformConfig = (0, amplify_e2e_core_1.getTransformConfig)(projRoot, name);
        expect(transformConfig).toBeDefined();
        expect(transformConfig.ResolverConfig).toBeDefined();
        expect(transformConfig.ResolverConfig.project).toBeDefined();
        expect(transformConfig.ResolverConfig.project.ConflictDetection).toEqual('VERSION');
        expect(transformConfig.ResolverConfig.project.ConflictHandler).toEqual('AUTOMERGE');
        // update and push with codebase
        yield (0, amplify_e2e_core_1.updateAPIWithResolutionStrategyWithModels)(projRoot, { testingWithLatestCodebase: true });
        expect((0, amplify_e2e_core_1.getCLIInputs)(projRoot, 'api', 'syncenabled')).toBeDefined();
        transformConfig = (0, amplify_e2e_core_1.getTransformConfig)(projRoot, name);
        expect(transformConfig).toBeDefined();
        expect(transformConfig.Version).toBeDefined();
        expect(transformConfig.Version).toEqual(graphql_transformer_core_1.TRANSFORM_CURRENT_VERSION);
        expect(transformConfig.ResolverConfig).toBeDefined();
        expect(transformConfig.ResolverConfig.project).toBeDefined();
        expect(transformConfig.ResolverConfig.project.ConflictDetection).toEqual('VERSION');
        expect(transformConfig.ResolverConfig.project.ConflictHandler).toEqual('OPTIMISTIC_CONCURRENCY');
        yield (0, amplify_e2e_core_1.amplifyPushUpdate)(projRoot, undefined, true, true);
        const meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
        const { output } = meta.api[name];
        const { GraphQLAPIIdOutput, GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput } = output;
        const { graphqlApi } = yield (0, amplify_e2e_core_1.getAppSyncApi)(GraphQLAPIIdOutput, meta.providers.awscloudformation.Region);
        expect(GraphQLAPIIdOutput).toBeDefined();
        expect(GraphQLAPIEndpointOutput).toBeDefined();
        expect(GraphQLAPIKeyOutput).toBeDefined();
        expect(graphqlApi).toBeDefined();
        expect(graphqlApi.apiId).toEqual(GraphQLAPIIdOutput);
    }));
});
//# sourceMappingURL=api-migration-c.test.js.map