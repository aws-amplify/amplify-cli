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
exports.pullPushWithLatestCodebaseValidateParameterAndCfnDrift = exports.collectCloudformationDiffBetweenProjects = exports.assertNoParameterChangesBetweenProjects = exports.getShortId = void 0;
const uuid_1 = require("uuid");
const amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
const cfnDiff = __importStar(require("@aws-cdk/cloudformation-diff"));
const stream_1 = require("stream");
const amplify_cli_core_1 = require("amplify-cli-core");
const strip_ansi_1 = __importDefault(require("strip-ansi"));
/**
 * generates a random string
 */
const getShortId = () => {
    const [shortId] = (0, uuid_1.v4)().split('-');
    return shortId;
};
exports.getShortId = getShortId;
/**
 * Asserts that parameters between two project directories didn't drift.
 */
const assertNoParameterChangesBetweenProjects = (projectRoot1, projectRoot2, options) => {
    const backendConfig1 = (0, amplify_e2e_core_1.getBackendConfig)(projectRoot1);
    const backendConfig2 = (0, amplify_e2e_core_1.getBackendConfig)(projectRoot2);
    expect(backendConfig2).toMatchObject(backendConfig1);
    for (const categoryKey of Object.keys(backendConfig1)) {
        const category = backendConfig1[categoryKey];
        if (Object.values(amplify_cli_core_1.AmplifyCategories).includes(categoryKey)) {
            for (const resourceKey of Object.keys(category)) {
                if ((0, amplify_e2e_core_1.cliInputsExists)(projectRoot1, categoryKey, resourceKey)) {
                    const cliInputs1 = (0, amplify_e2e_core_1.getCLIInputs)(projectRoot1, categoryKey, resourceKey);
                    const cliInputs2 = (0, amplify_e2e_core_1.getCLIInputs)(projectRoot2, categoryKey, resourceKey);
                    expect(cliInputs1).toEqual(cliInputs2);
                }
                if ((0, amplify_e2e_core_1.parametersExists)(projectRoot1, categoryKey, resourceKey)) {
                    let parameters1 = (0, amplify_e2e_core_1.getParameters)(projectRoot1, categoryKey, resourceKey);
                    let parameters2 = (0, amplify_e2e_core_1.getParameters)(projectRoot2, categoryKey, resourceKey);
                    if (options && options.excludeFromParameterDiff) {
                        const afterExclusions = options.excludeFromParameterDiff(categoryKey, resourceKey, {
                            project1: parameters1,
                            project2: parameters2,
                        });
                        parameters1 = afterExclusions.project1;
                        parameters2 = afterExclusions.project2;
                    }
                    expect(parameters1).toEqual(parameters2);
                }
            }
        }
    }
};
exports.assertNoParameterChangesBetweenProjects = assertNoParameterChangesBetweenProjects;
class InMemoryWritable extends stream_1.Writable {
    constructor() {
        super(...arguments);
        this._payload = '';
    }
    _write(chunk, __encoding, callback) {
        if (chunk) {
            this._payload += chunk.toString();
        }
        callback();
    }
    toString() {
        return this._payload;
    }
}
/**
 * Collects all differences between cloud formation templates into a single string.
 */
const collectCloudformationDiffBetweenProjects = (projectRoot1, projectRoot2, excludeFn) => {
    const backendConfig1 = (0, amplify_e2e_core_1.getBackendConfig)(projectRoot1);
    const backendConfig2 = (0, amplify_e2e_core_1.getBackendConfig)(projectRoot2);
    expect(backendConfig2).toMatchObject(backendConfig1);
    const stream = new InMemoryWritable();
    for (const categoryKey of Object.keys(backendConfig1)) {
        const category = backendConfig1[categoryKey];
        for (const resourceKey of Object.keys(category)) {
            let template1 = (0, amplify_e2e_core_1.getCloudFormationTemplate)(projectRoot1, categoryKey, resourceKey);
            let template2 = (0, amplify_e2e_core_1.getCloudFormationTemplate)(projectRoot2, categoryKey, resourceKey);
            // Description does not matter much and it can contain os/runtime specific words.
            delete template1.Description;
            delete template2.Description;
            if (excludeFn) {
                const afterExclusions = excludeFn(categoryKey, resourceKey, { project1: template1, project2: template2 });
                template1 = afterExclusions.project1;
                template2 = afterExclusions.project2;
            }
            const templateDiff = cfnDiff.diffTemplate(template1, template2);
            if (!templateDiff.isEmpty) {
                cfnDiff.formatDifferences(stream, templateDiff);
            }
        }
    }
    return (0, strip_ansi_1.default)(stream.toString());
};
exports.collectCloudformationDiffBetweenProjects = collectCloudformationDiffBetweenProjects;
/**
 * Pulls and pushes project with latest codebase. Validates parameter and cfn drift.
 */
const pullPushWithLatestCodebaseValidateParameterAndCfnDrift = (projRoot, projName) => __awaiter(void 0, void 0, void 0, function* () {
    const appId = (0, amplify_e2e_core_1.getAppId)(projRoot);
    expect(appId).toBeDefined();
    const projRoot2 = yield (0, amplify_e2e_core_1.createNewProjectDir)(`${projName}2`);
    try {
        yield (0, amplify_e2e_core_1.amplifyPull)(projRoot2, { emptyDir: true, appId }, true);
        (0, exports.assertNoParameterChangesBetweenProjects)(projRoot, projRoot2);
        expect((0, exports.collectCloudformationDiffBetweenProjects)(projRoot, projRoot2)).toMatchSnapshot();
        yield (0, amplify_e2e_core_1.amplifyPushWithoutCodegen)(projRoot2, true);
        (0, exports.assertNoParameterChangesBetweenProjects)(projRoot, projRoot2);
        expect((0, exports.collectCloudformationDiffBetweenProjects)(projRoot, projRoot2)).toMatchSnapshot();
    }
    finally {
        (0, amplify_e2e_core_1.deleteProjectDir)(projRoot2);
    }
});
exports.pullPushWithLatestCodebaseValidateParameterAndCfnDrift = pullPushWithLatestCodebaseValidateParameterAndCfnDrift;
//# sourceMappingURL=utils.js.map