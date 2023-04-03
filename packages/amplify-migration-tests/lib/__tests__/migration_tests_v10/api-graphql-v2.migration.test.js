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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
const init_1 = require("../../migration-helpers-v10/init");
const utils_1 = require("../../migration-helpers/utils");
const fs = __importStar(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const cfn_diff_exclusions_1 = require("../../migration-helpers-v10/cfn-diff-exclusions");
describe('api graphql v2 migration tests', () => {
    let projRoot;
    afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, amplify_e2e_core_1.deleteProject)(projRoot, undefined, true);
        (0, amplify_e2e_core_1.deleteProjectDir)(projRoot);
    }));
    // inspired by api_7.test.ts
    it('...adds graphql with v2 transformer, adds overrides, and pulls in latest version', () => __awaiter(void 0, void 0, void 0, function* () {
        const projectName = 'gqmigration';
        projRoot = yield (0, amplify_e2e_core_1.createNewProjectDir)(projectName);
        yield (0, init_1.initJSProjectWithProfileV10)(projRoot, { name: projectName, disableAmplifyAppCreation: false });
        yield (0, amplify_e2e_core_1.addApiWithoutSchema)(projRoot);
        yield (0, amplify_e2e_core_1.updateApiSchema)(projRoot, projectName, 'simple_model.graphql');
        yield (0, amplify_e2e_core_1.amplifyPushLegacy)(projRoot);
        const meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
        const region = meta.providers.awscloudformation.Region;
        // eslint-disable-next-line spellcheck/spell-checker
        const { output } = meta.api.gqmigration;
        const { GraphQLAPIIdOutput } = output;
        // add overrides
        yield (0, amplify_e2e_core_1.amplifyOverrideApi)(projRoot);
        const srcOverrideFilePath = path_1.default.join(__dirname, '..', '..', '..', 'overrides', 'override-api-gql.v10.ts');
        const destOverrideFilePath = path_1.default.join(projRoot, 'amplify', 'backend', 'api', `${projectName}`, 'override.ts');
        fs.copyFileSync(srcOverrideFilePath, destOverrideFilePath);
        yield (0, amplify_e2e_core_1.amplifyPushOverride)(projRoot);
        // pull down with vlatest
        const appId = (0, amplify_e2e_core_1.getAppId)(projRoot);
        expect(appId).toBeDefined();
        const projRoot2 = yield (0, amplify_e2e_core_1.createNewProjectDir)(`${projectName}2`);
        try {
            yield (0, amplify_e2e_core_1.amplifyPull)(projRoot2, { emptyDir: true, appId }, true);
            (0, utils_1.assertNoParameterChangesBetweenProjects)(projRoot, projRoot2);
            expect((0, utils_1.collectCloudformationDiffBetweenProjects)(projRoot, projRoot2, cfn_diff_exclusions_1.cfnDiffExclusions)).toMatchSnapshot();
            yield (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot2, true);
            (0, utils_1.assertNoParameterChangesBetweenProjects)(projRoot, projRoot2);
            expect((0, utils_1.collectCloudformationDiffBetweenProjects)(projRoot, projRoot2, cfn_diff_exclusions_1.cfnDiffExclusions)).toMatchSnapshot();
            // check overridden config in cloud after pushing with vLatest
            const overriddenAppsyncApiOverride = yield (0, amplify_e2e_core_1.getAppSyncApi)(GraphQLAPIIdOutput, region);
            expect(overriddenAppsyncApiOverride.graphqlApi).toBeDefined();
            expect(overriddenAppsyncApiOverride.graphqlApi.apiId).toEqual(GraphQLAPIIdOutput);
            // eslint-disable-next-line spellcheck/spell-checker
            expect(overriddenAppsyncApiOverride.graphqlApi.xrayEnabled).toEqual(true);
        }
        finally {
            (0, amplify_e2e_core_1.deleteProjectDir)(projRoot2);
        }
    }));
});
//# sourceMappingURL=api-graphql-v2.migration.test.js.map