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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureFlagEnvironmentProvider = void 0;
const path = __importStar(require("path"));
const _ = __importStar(require("lodash"));
const dotenv_1 = require("dotenv");
const envVarFormatError_1 = require("./envVarFormatError");
const defaultFeatureFlagEnvironmentProviderOptions = {
    prefix: 'AMPLIFYCLI',
    environmentNameSeparator: '-',
    noEnvironmentNameSeparator: '_',
    envPathSeparator: '__',
    internalSeparator: ':',
};
class FeatureFlagEnvironmentProvider {
    constructor(options = defaultFeatureFlagEnvironmentProviderOptions) {
        this.options = options;
        this.load = () => new Promise((resolve, reject) => {
            if (!process.env) {
                resolve({
                    project: {},
                    environments: {},
                });
            }
            const envFilePath = this.options.projectPath ? path.join(this.options.projectPath, '.env') : undefined;
            (0, dotenv_1.config)({
                path: envFilePath,
            });
            const variableReducer = (result, key) => {
                if (key.startsWith(this.options.prefix) && process.env[key] !== undefined) {
                    let normalizedKey = key
                        .toLowerCase()
                        .slice(this.options.prefix.length)
                        .replace(this.options.envPathSeparator, this.options.internalSeparator);
                    if (normalizedKey.startsWith(this.options.environmentNameSeparator)) {
                        normalizedKey = normalizedKey.slice(this.options.environmentNameSeparator.length);
                        const [env, envRemaining] = this.parseUntilNextSeparator(key, normalizedKey, this.options.noEnvironmentNameSeparator);
                        const [section, property] = this.parseUntilNextSeparator(key, envRemaining, this.options.internalSeparator);
                        this.setValue(result, env, section, property, process.env[key]);
                    }
                    else if (normalizedKey.startsWith(this.options.noEnvironmentNameSeparator)) {
                        normalizedKey = normalizedKey.slice(this.options.noEnvironmentNameSeparator.length);
                        const [section, property] = this.parseUntilNextSeparator(key, normalizedKey, this.options.internalSeparator);
                        this.setValue(result, null, section, property, process.env[key]);
                    }
                    else {
                        reject(new envVarFormatError_1.EnvVarFormatError(key));
                    }
                }
                return result;
            };
            const variableMap = Object.keys(process.env).reduce((result, key) => variableReducer(result, key), {
                project: {},
                environments: {},
            });
            resolve(variableMap);
        });
        this.parseUntilNextSeparator = (key, input, separator, throwIfNotFound = true) => {
            const separatorIndex = input.indexOf(separator);
            if (separatorIndex <= 0 && throwIfNotFound) {
                throw new envVarFormatError_1.EnvVarFormatError(key);
            }
            const part = input.substring(0, separatorIndex);
            const remaining = input.slice(separatorIndex + separator.length);
            if (part.length === 0 || remaining.length === 0) {
                throw new envVarFormatError_1.EnvVarFormatError(key);
            }
            return [part, remaining];
        };
        this.setValue = (featureFlags, environment, section, property, value) => {
            if (!value) {
                return;
            }
            if (environment === null) {
                _.setWith(featureFlags, ['project', section, property], value);
            }
            else {
                _.setWith(featureFlags, ['environments', environment, section, property], value);
            }
        };
        this.options = {
            ...defaultFeatureFlagEnvironmentProviderOptions,
            ...options,
        };
    }
}
exports.FeatureFlagEnvironmentProvider = FeatureFlagEnvironmentProvider;
//# sourceMappingURL=featureFlagEnvironmentProvider.js.map