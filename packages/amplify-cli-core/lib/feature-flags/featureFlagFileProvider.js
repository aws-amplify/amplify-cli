"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureFlagFileProvider = void 0;
const lodash_1 = __importDefault(require("lodash"));
const state_manager_1 = require("../state-manager");
class FeatureFlagFileProvider {
    constructor(environmentProvider, options = {}) {
        this.environmentProvider = environmentProvider;
        this.options = options;
        this.load = async () => {
            if (!this.options.projectPath) {
                throw new Error("'projectPath' option is missing");
            }
            const result = {
                project: {},
                environments: {},
            };
            const projectFeatures = await this.loadConfig(this.options.projectPath);
            if (projectFeatures) {
                result.project = projectFeatures;
            }
            const envName = this.environmentProvider.getCurrentEnvName();
            if (envName !== '') {
                const envFeatures = await this.loadConfig(this.options.projectPath, envName);
                if (envFeatures) {
                    result.environments[envName] = envFeatures;
                }
            }
            return result;
        };
        this.loadConfig = async (projectPath, env) => {
            const configFileData = state_manager_1.stateManager.getCLIJSON(projectPath, env, {
                throwIfNotExist: false,
            });
            if (!configFileData || !configFileData.features) {
                return undefined;
            }
            const toLower = (result, val, key) => {
                result[key.toLowerCase()] = val;
            };
            const mappedFeatures = Object.keys(configFileData.features).reduce((ffe, f) => {
                ffe[f.toLowerCase()] = lodash_1.default.transform(configFileData.features[f], toLower);
                return ffe;
            }, {});
            return mappedFeatures;
        };
    }
}
exports.FeatureFlagFileProvider = FeatureFlagFileProvider;
//# sourceMappingURL=featureFlagFileProvider.js.map