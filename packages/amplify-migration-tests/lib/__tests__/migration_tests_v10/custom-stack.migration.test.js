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
Object.defineProperty(exports, "__esModule", { value: true });
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
const init_1 = require("../../migration-helpers-v10/init");
const utils_1 = require("../../migration-helpers/utils");
describe('adding custom resources migration test', () => {
    let projRoot;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        projRoot = yield (0, amplify_e2e_core_1.createNewProjectDir)('custom-resources');
    }));
    afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, amplify_e2e_core_1.deleteProject)(projRoot, null, true);
        (0, amplify_e2e_core_1.deleteProjectDir)(projRoot);
    }));
    it('add/update CDK and CFN custom resources', () => __awaiter(void 0, void 0, void 0, function* () {
        const cdkResourceName = `custom${(0, uuid_1.v4)().split('-')[0]}`;
        const cfnResourceName = `custom${(0, uuid_1.v4)().split('-')[0]}`;
        const cfnResourceNameWithV10 = `custom${(0, uuid_1.v4)().split('-')[0]}`;
        yield (0, init_1.initJSProjectWithProfileV10)(projRoot, { name: 'customMigration', disableAmplifyAppCreation: false });
        const appId = (0, amplify_e2e_core_1.getAppId)(projRoot);
        expect(appId).toBeDefined();
        yield (0, amplify_e2e_core_1.addCDKCustomResource)(projRoot, { name: cdkResourceName });
        yield (0, amplify_e2e_core_1.addCFNCustomResource)(projRoot, { name: cfnResourceNameWithV10, promptForCategorySelection: true });
        const srcCFNCustomResourceFilePath = path.join(__dirname, '..', '..', '..', 'custom-resources', 'custom-cfn-stack.json');
        // adding a resource to custom cfn stack
        const destCFNCustomResourceFilePath = path.join(projRoot, 'amplify', 'backend', 'custom', cfnResourceNameWithV10, `${cfnResourceNameWithV10}-cloudformation-template.json`);
        fs.copyFileSync(srcCFNCustomResourceFilePath, destCFNCustomResourceFilePath);
        // this is where we will write our custom cdk stack logic to
        const destCustomResourceFilePath = path.join(projRoot, 'amplify', 'backend', 'custom', cdkResourceName, 'cdk-stack.ts');
        const cfnFilePath = path.join(projRoot, 'amplify', 'backend', 'custom', cdkResourceName, 'build', `${cdkResourceName}-cloudformation-template.json`);
        const srcCustomResourceFilePath = path.join(__dirname, '..', '..', '..', 'custom-resources', 'custom-cdk-stack-v10.ts');
        fs.copyFileSync(srcCustomResourceFilePath, destCustomResourceFilePath);
        yield (0, amplify_e2e_core_1.buildCustomResources)(projRoot);
        yield (0, amplify_e2e_core_1.amplifyPushAuthV10)(projRoot);
        // check if cfn file is generated in the build dir
        expect(fs.existsSync(cfnFilePath)).toEqual(true);
        const buildCFNFileJSON = amplify_cli_core_1.JSONUtilities.readJson(cfnFilePath);
        // Basic sanity generated CFN file content check
        expect(buildCFNFileJSON === null || buildCFNFileJSON === void 0 ? void 0 : buildCFNFileJSON.Parameters).toEqual({
            env: { Type: 'String', Description: 'Current Amplify CLI env name' },
        });
        expect(Object.keys(buildCFNFileJSON === null || buildCFNFileJSON === void 0 ? void 0 : buildCFNFileJSON.Outputs)).toEqual(['snsTopicArn']);
        const meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
        const { snsTopicArn: customResourceSNSArn } = Object.keys(meta.custom).map((key) => meta.custom[key])[0].output;
        expect(customResourceSNSArn).toBeDefined();
        // using latest code, pull down the project
        const projRoot2 = yield (0, amplify_e2e_core_1.createNewProjectDir)('customMigration2');
        const usingLatestCode = true;
        try {
            yield (0, amplify_e2e_core_1.amplifyPull)(projRoot2, { emptyDir: true, appId }, usingLatestCode);
            (0, utils_1.assertNoParameterChangesBetweenProjects)(projRoot, projRoot2);
            expect((0, utils_1.collectCloudformationDiffBetweenProjects)(projRoot, projRoot2)).toMatchSnapshot();
            yield (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot2, usingLatestCode);
            (0, utils_1.assertNoParameterChangesBetweenProjects)(projRoot, projRoot2);
            expect((0, utils_1.collectCloudformationDiffBetweenProjects)(projRoot, projRoot2)).toMatchSnapshot();
            // building custom resources succeeds against a v10 cdk stack, even when using vLatest to build
            yield expect((0, amplify_e2e_core_1.buildCustomResources)(projRoot2, usingLatestCode)).resolves.not.toThrow();
            // migrate overrides to use vLatest
            const srcVLatestCustomResourceFilePath = path.join(__dirname, '..', '..', '..', 'custom-resources', 'custom-cdk-stack-vLatest.ts');
            const destVLatestCustomResourceFilePath = path.join(projRoot2, 'amplify', 'backend', 'custom', cdkResourceName, 'cdk-stack.ts');
            fs.copyFileSync(srcVLatestCustomResourceFilePath, destVLatestCustomResourceFilePath);
            // this should fail because customer also needs to update package.json dependencies for cdkV2
            yield expect((0, amplify_e2e_core_1.buildCustomResources)(projRoot2, usingLatestCode)).rejects.toThrow();
            // emulate updating the package.json dependencies
            const srcVLatestCustomPackageJSONFilePath = path.join(__dirname, '..', '..', '..', 'custom-resources', 'custom-cdk-stack-vLatest.package.json');
            const destVLatestCustomPackageJSONFilePath = path.join(projRoot2, 'amplify', 'backend', 'custom', cdkResourceName, 'package.json');
            fs.copyFileSync(srcVLatestCustomPackageJSONFilePath, destVLatestCustomPackageJSONFilePath);
            // this should pass now
            yield (0, amplify_e2e_core_1.buildCustomResources)(projRoot2, usingLatestCode);
            yield (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot2, usingLatestCode);
            // // Using latest code, add custom CFN and add dependency of custom CDK resource on the custom CFN
            yield (0, amplify_e2e_core_1.addCFNCustomResource)(projRoot2, { name: cfnResourceName, promptForCustomResourcesSelection: true }, usingLatestCode);
            const customCFNFilePath = path.join(projRoot2, 'amplify', 'backend', 'custom', cfnResourceName, `${cfnResourceName}-cloudformation-template.json`);
            const customCFNFileJSON = amplify_cli_core_1.JSONUtilities.readJson(customCFNFilePath);
            // Make sure input params has params from the resource dependency
            expect(customCFNFileJSON === null || customCFNFileJSON === void 0 ? void 0 : customCFNFileJSON.Parameters).toEqual({
                env: { Type: 'String' },
                [`custom${cdkResourceName}snsTopicArn`]: {
                    Type: 'String',
                    Description: `Input parameter describing snsTopicArn attribute for custom/${cdkResourceName} resource`,
                },
            });
        }
        finally {
            (0, amplify_e2e_core_1.deleteProjectDir)(projRoot2);
        }
    }));
});
//# sourceMappingURL=custom-stack.migration.test.js.map