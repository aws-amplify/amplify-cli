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
const path_1 = require("path");
const migration_helpers_1 = require("../../../migration-helpers");
describe('api migration update test a', () => {
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
    it('api update migration with multiauth', () => __awaiter(void 0, void 0, void 0, function* () {
        // init and add api with installed CLI
        yield (0, migration_helpers_1.initJSProjectWithProfileV4_52_0)(projRoot, { name: 'simplemodelmultiauth' });
        yield (0, migration_helpers_1.addApiWithoutSchemaOldDx)(projRoot);
        yield (0, amplify_e2e_core_1.updateApiSchema)(projRoot, 'simplemodelmultiauth', 'simple_model.graphql');
        yield (0, amplify_e2e_core_1.amplifyPushLegacy)(projRoot);
        // update and push with codebase
        yield (0, amplify_e2e_core_1.updateApiWithMultiAuth)(projRoot, { testingWithLatestCodebase: true });
        // cli-inputs should exist
        expect((0, amplify_e2e_core_1.getCLIInputs)(projRoot, 'api', 'simplemodelmultiauth')).toBeDefined();
        yield (0, amplify_e2e_core_1.amplifyPushUpdate)(projRoot, undefined, true, true);
        const meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
        const { output } = meta.api.simplemodelmultiauth;
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
});
//# sourceMappingURL=api-migration-a.test.js.map