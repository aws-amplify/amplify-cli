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
Object.defineProperty(exports, "__esModule", { value: true });
const amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
const fs_1 = require("fs");
const graphql_transformer_core_1 = require("graphql-transformer-core");
const path_1 = require("path");
const migration_helpers_1 = require("../../migration-helpers");
describe('api migration update test', () => {
    let projRoot;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        projRoot = yield (0, amplify_e2e_core_1.createNewProjectDir)('graphql-api');
        const migrateFromVersion = { v: 'unintialized' };
        const migrateToVersion = { v: 'unintialized' };
        yield (0, migration_helpers_1.versionCheck)(process.cwd(), false, migrateFromVersion);
        yield (0, migration_helpers_1.versionCheck)(process.cwd(), true, migrateToVersion);
        expect(migrateFromVersion.v).not.toEqual(migrateToVersion.v);
        expect(migration_helpers_1.allowedVersionsToMigrateFrom).toContain(migrateFromVersion.v);
        yield (0, migration_helpers_1.initJSProjectWithProfileV4_52_0)(projRoot, { name: 'apimigration' });
    }));
    afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
        const metaFilePath = (0, path_1.join)(projRoot, 'amplify', '#current-cloud-backend', 'amplify-meta.json');
        if ((0, fs_1.existsSync)(metaFilePath)) {
            yield (0, amplify_e2e_core_1.deleteProject)(projRoot, null, true);
        }
        (0, amplify_e2e_core_1.deleteProjectDir)(projRoot);
    }));
    it('init and add api with installed CLI then migrate for update and push', () => __awaiter(void 0, void 0, void 0, function* () {
        const initialSchema = 'initial_key_blog.graphql';
        const nextSchema = 'next_key_blog.graphql';
        // init the project and add api with installed cli
        const { projectName } = (0, amplify_e2e_core_1.getProjectConfig)(projRoot);
        yield (0, migration_helpers_1.addApiWithoutSchemaOldDx)(projRoot);
        (0, amplify_e2e_core_1.updateApiSchema)(projRoot, projectName, initialSchema);
        yield (0, amplify_e2e_core_1.amplifyPushLegacy)(projRoot);
        // update api and push with the CLI to be released (the codebase)
        (0, amplify_e2e_core_1.updateApiSchema)(projRoot, projectName, nextSchema);
        yield (0, amplify_e2e_core_1.amplifyPushUpdate)(projRoot, undefined, true);
        const { output } = (0, amplify_e2e_core_1.getProjectMeta)(projRoot).api[projectName];
        const { GraphQLAPIIdOutput, GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput } = output;
        expect(GraphQLAPIIdOutput).toBeDefined();
        expect(GraphQLAPIEndpointOutput).toBeDefined();
        expect(GraphQLAPIKeyOutput).toBeDefined();
    }));
    it('api update migration with multiauth', () => __awaiter(void 0, void 0, void 0, function* () {
        // init and add api with installed CLI
        const { projectName } = (0, amplify_e2e_core_1.getProjectConfig)(projRoot);
        yield (0, migration_helpers_1.addApiWithoutSchemaOldDx)(projRoot);
        (0, amplify_e2e_core_1.updateApiSchema)(projRoot, projectName, 'simple_model.graphql');
        // update and push with codebase
        yield (0, amplify_e2e_core_1.updateApiWithMultiAuth)(projRoot, { testingWithLatestCodebase: true });
        yield (0, amplify_e2e_core_1.amplifyPush)(projRoot, true);
        const meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
        const { output } = meta.api[projectName];
        const { GraphQLAPIIdOutput, GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput } = output;
        const { graphqlApi } = yield (0, amplify_e2e_core_1.getAppSyncApi)(GraphQLAPIIdOutput, meta.providers.awscloudformation.Region);
        expect(graphqlApi).toBeDefined();
        expect(graphqlApi.authenticationType).toEqual('API_KEY');
        expect(graphqlApi.additionalAuthenticationProviders).toHaveLength(3);
        expect(graphqlApi.additionalAuthenticationProviders).toHaveLength(3);
        const cognito = graphqlApi.additionalAuthenticationProviders.filter((a) => a.authenticationType === 'AMAZON_COGNITO_USER_POOLS')[0];
        expect(cognito).toBeDefined();
        expect(cognito.userPoolConfig).toBeDefined();
        const iam = graphqlApi.additionalAuthenticationProviders.filter((a) => a.authenticationType === 'AWS_IAM')[0];
        expect(iam).toBeDefined();
        const oidc = graphqlApi.additionalAuthenticationProviders.filter((a) => a.authenticationType === 'OPENID_CONNECT')[0];
        expect(oidc).toBeDefined();
        expect(oidc.openIDConnectConfig).toBeDefined();
        expect(oidc.openIDConnectConfig.issuer).toEqual('https://facebook.com/');
        expect(oidc.openIDConnectConfig.clientId).toEqual('clientId');
        expect(oidc.openIDConnectConfig.iatTTL).toEqual(1000);
        expect(oidc.openIDConnectConfig.authTTL).toEqual(2000);
        expect(GraphQLAPIIdOutput).toBeDefined();
        expect(GraphQLAPIEndpointOutput).toBeDefined();
        expect(GraphQLAPIKeyOutput).toBeDefined();
        expect(graphqlApi).toBeDefined();
        expect(graphqlApi.apiId).toEqual(GraphQLAPIIdOutput);
    }));
    it('init a sync enabled project and update conflict resolution strategy', () => __awaiter(void 0, void 0, void 0, function* () {
        // add api with locally installed cli
        const { projectName: name } = (0, amplify_e2e_core_1.getProjectConfig)(projRoot);
        yield (0, migration_helpers_1.addApiWithSchemaAndConflictDetectionOldDx)(projRoot, 'simple_model.graphql');
        let transformConfig = (0, amplify_e2e_core_1.getTransformConfig)(projRoot, name);
        expect(transformConfig).toBeDefined();
        expect(transformConfig.ResolverConfig).toBeDefined();
        expect(transformConfig.ResolverConfig.project).toBeDefined();
        expect(transformConfig.ResolverConfig.project.ConflictDetection).toEqual('VERSION');
        expect(transformConfig.ResolverConfig.project.ConflictHandler).toEqual('AUTOMERGE');
        //update and push with codebase
        yield (0, amplify_e2e_core_1.updateAPIWithResolutionStrategyWithModels)(projRoot, { testingWithLatestCodebase: true });
        transformConfig = (0, amplify_e2e_core_1.getTransformConfig)(projRoot, name);
        expect(transformConfig).toBeDefined();
        expect(transformConfig.Version).toBeDefined();
        expect(transformConfig.Version).toEqual(graphql_transformer_core_1.TRANSFORM_CURRENT_VERSION);
        expect(transformConfig.ResolverConfig).toBeDefined();
        expect(transformConfig.ResolverConfig.project).toBeDefined();
        expect(transformConfig.ResolverConfig.project.ConflictDetection).toEqual('VERSION');
        expect(transformConfig.ResolverConfig.project.ConflictHandler).toEqual('OPTIMISTIC_CONCURRENCY');
        yield (0, amplify_e2e_core_1.amplifyPush)(projRoot, true);
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
//# sourceMappingURL=api_migration_update.test.js.map