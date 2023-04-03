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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureFlags = void 0;
const ajv_1 = __importDefault(require("ajv"));
const ci_info_1 = require("ci-info");
const fs = __importStar(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const path = __importStar(require("path"));
const amplify_error_1 = require("../errors/amplify-error");
const amplify_fault_1 = require("../errors/amplify-fault");
const jsonUtilities_1 = require("../jsonUtilities");
const state_manager_1 = require("../state-manager");
const featureFlagEnvironmentProvider_1 = require("./featureFlagEnvironmentProvider");
const featureFlagFileProvider_1 = require("./featureFlagFileProvider");
class FeatureFlags {
    constructor(environmentProvider, projectPath, useNewDefaults) {
        this.environmentProvider = environmentProvider;
        this.projectPath = projectPath;
        this.useNewDefaults = useNewDefaults;
        this.registrations = new Map();
        this.effectiveFlags = {};
        this.newProjectDefaults = {};
        this.existingProjectDefaults = {};
        this.getValue = (flagName, type) => {
            var _b;
            if (!flagName) {
                throw new Error("'flagName' argument is required");
            }
            let value;
            const parts = flagName.toLowerCase().split('.');
            if (parts.length !== 2) {
                throw new Error(`Invalid flagName value: '${flagName}'`);
            }
            const sectionRegistration = this.registrations.get(parts[0]);
            if (!sectionRegistration) {
                throw new Error(`Section '${parts[0]}' is not registered in feature provider`);
            }
            const flagRegistrationEntry = sectionRegistration === null || sectionRegistration === void 0 ? void 0 : sectionRegistration.find((flag) => flag.name === parts[1]);
            if (!flagRegistrationEntry) {
                throw new Error(`Flag '${parts[1]}' within '${parts[0]}' is not registered in feature provider`);
            }
            if ((flagRegistrationEntry === null || flagRegistrationEntry === void 0 ? void 0 : flagRegistrationEntry.type) !== type) {
                throw new Error(`'${flagName}' is a ${flagRegistrationEntry.type} type, not ${type}`);
            }
            value = (_b = this.effectiveFlags[parts[0]]) === null || _b === void 0 ? void 0 : _b[parts[1]];
            if (value === undefined && flagRegistrationEntry) {
                if (this.useNewDefaults) {
                    value = flagRegistrationEntry.defaultValueForNewProjects;
                }
                else {
                    value = flagRegistrationEntry.defaultValueForExistingProjects;
                }
            }
            return value !== null && value !== void 0 ? value : false;
        };
        this.buildJSONSchemaFromRegistrations = () => [...this.registrations.entries()].reduce((schema, r) => {
            var _b;
            const currentSection = ((_b = schema.properties[r[0].toLowerCase()]) !== null && _b !== void 0 ? _b : {
                type: 'object',
                additionalProperties: false,
            });
            currentSection.properties = r[1].reduce((p, fr) => {
                p[fr.name.toLowerCase()] = {
                    type: fr.type,
                    default: fr.defaultValueForNewProjects,
                };
                return p;
            }, {});
            schema.properties[r[0].toLowerCase()] = currentSection;
            return schema;
        }, {
            $schema: 'http://json-schema.org/draft-07/schema#',
            type: 'object',
            additionalProperties: false,
            properties: {},
        });
        this.buildDefaultValues = () => {
            this.newProjectDefaults = [...this.registrations.entries()].reduce((result, r) => {
                const nest = r[1].reduce((p, fr) => {
                    p[fr.name] = fr.defaultValueForNewProjects;
                    return p;
                }, {});
                result[r[0]] = {
                    ...result[r[0]],
                    ...nest,
                };
                return result;
            }, {});
            this.existingProjectDefaults = [...this.registrations.entries()].reduce((result, r) => {
                const nest = r[1].reduce((p, fr) => {
                    p[fr.name] = fr.defaultValueForExistingProjects;
                    return p;
                }, {});
                result[r[0]] = {
                    ...result[r[0]],
                    ...nest,
                };
                return result;
            }, {});
        };
        this.validateFlags = (allFlags) => {
            const schema = this.buildJSONSchemaFromRegistrations();
            const ajv = new ajv_1.default({
                allErrors: true,
            });
            const schemaValidate = ajv.compile(schema);
            const validator = (flags) => {
                const valid = schemaValidate(flags);
                if (!valid && schemaValidate.errors) {
                    const unknownFlags = [];
                    const otherErrors = [];
                    schemaValidate.errors.forEach((error) => {
                        var _b;
                        if (error.keyword === 'additionalProperties') {
                            const additionalProperty = (_b = error.params) === null || _b === void 0 ? void 0 : _b.additionalProperty;
                            let flagName = error.dataPath.length > 0 && error.dataPath[0] === '.' ? `${error.dataPath.slice(1)}.` : '';
                            if (additionalProperty) {
                                if (flags[flagName.replace('.', '')][additionalProperty] === false) {
                                    return;
                                }
                                flagName += additionalProperty;
                            }
                            if (flagName.length > 0) {
                                unknownFlags.push(flagName);
                            }
                        }
                        else {
                            const errorMessage = error.dataPath.length > 0 && error.dataPath[0] === '.'
                                ? `${error.dataPath.slice(1)}: ${error.message}`
                                : `${error.dataPath}: ${error.message}`;
                            otherErrors.push(errorMessage);
                        }
                    });
                    if (unknownFlags.length > 0 || otherErrors.length > 0) {
                        throw new amplify_error_1.AmplifyError('FeatureFlagsValidationError', {
                            message: 'Invalid feature flag configuration',
                            details: (unknownFlags.length > 0
                                ? `These feature flags are defined in the "amplify/cli.json" configuration file and are unknown to the currently running Amplify CLI:\n${unknownFlags
                                    .map((el) => `- ${el}`)
                                    .join(',\n')}\n`
                                : '') +
                                (otherErrors.length > 0
                                    ? `The following feature flags have validation errors:\n${otherErrors.map((el) => `- ${el}`).join(',\n')}`
                                    : ''),
                            resolution: `This issue likely happens when the project has been pushed with a newer version of Amplify CLI, try updating to a newer version.${ci_info_1.isCI ? '\nEnsure that the CI/CD pipeline is not using an older or pinned down version of Amplify CLI.' : ''}`,
                            link: 'https://docs.amplify.aws/cli/reference/feature-flags',
                        });
                    }
                }
            };
            const featureFlagsValidator = (features) => {
                validator(features.project);
                Object.keys(features.environments).forEach((env) => {
                    validator(features.environments[env]);
                });
            };
            allFlags.forEach((flagItem) => {
                featureFlagsValidator(flagItem.flags);
            });
        };
        this.transformEnvFlags = (features) => {
            const convertValue = (section, flagName, value) => {
                const sectionRegistration = this.registrations.get(section);
                if (!sectionRegistration) {
                    throw new Error(`Section '${section}' is not registered in feature provider`);
                }
                const flagRegistrationEntry = sectionRegistration.find((flag) => flag.name === flagName);
                if (!flagRegistrationEntry) {
                    throw new Error(`Flag '${flagName}' within '${section}' is not registered in feature provider`);
                }
                switch (flagRegistrationEntry.type) {
                    case 'boolean':
                        if (value === 'true') {
                            return true;
                        }
                        if (value === 'false') {
                            return false;
                        }
                        throw new Error(`Invalid boolean value: '${value}' for '${flagName}' in section '${section}'`);
                    case 'number': {
                        const n = Number.parseInt(value, 10);
                        if (!Number.isNaN(n)) {
                            return n;
                        }
                        throw new Error(`Invalid number value: '${value}' for '${flagName}' in section '${section}'`);
                    }
                    default:
                        throw new Error(`Invalid number value: ${value} for ${flagName}`);
                }
            };
            const mapFeatureFlagEntry = (input) => Object.keys(input).reduce((result, section) => {
                const sourceObject = input[section];
                result[section] = Object.keys(sourceObject).reduce((resultFlag, flagName) => {
                    const sourceValue = sourceObject[flagName];
                    resultFlag[flagName] = convertValue(section, flagName, sourceValue);
                    return resultFlag;
                }, {});
                return result;
            }, {});
            features.project = mapFeatureFlagEntry(features.project);
            Object.keys(features.environments).forEach((env) => {
                features.environments[env] = mapFeatureFlagEntry(features.environments[env]);
            });
            return features;
        };
        this.loadValues = async () => {
            var _b, _c;
            const fileFlags = await this.fileValueProvider.load();
            const envFlags = this.transformEnvFlags(await this.envValueProvider.load());
            this.validateFlags([
                {
                    name: 'File',
                    flags: fileFlags,
                },
                {
                    name: 'Environment',
                    flags: envFlags,
                },
            ]);
            this.buildDefaultValues();
            this.effectiveFlags = lodash_1.default.merge(this.useNewDefaults ? this.newProjectDefaults : this.existingProjectDefaults, fileFlags.project, (_b = fileFlags.environments[this.environmentProvider.getCurrentEnvName()]) !== null && _b !== void 0 ? _b : {}, envFlags.project, (_c = envFlags.environments[this.environmentProvider.getCurrentEnvName()]) !== null && _c !== void 0 ? _c : {});
        };
        this.registerFlag = (section, flags) => {
            var _b;
            if (!section) {
                throw new Error("'section' argument is required");
            }
            if (!flags) {
                throw new Error("'flags' argument is required");
            }
            const newFlags = (_b = this.registrations.get(section.toLowerCase())) !== null && _b !== void 0 ? _b : new Array();
            flags.forEach((flag) => {
                if (!flag.name || flag.name.trim().length === 0) {
                    throw new Error('Flag does not have a name specified');
                }
                if (newFlags.find((f) => f.name === flag.name.toLowerCase())) {
                    throw new Error(`Flag with name: '${flag.name}' is already registered in section: '${section}'`);
                }
                flag.name = flag.name.toLowerCase();
                newFlags.push(flag);
            });
            this.registrations.set(section.toLowerCase(), newFlags);
        };
        this.registerFlags = () => {
            this.registerFlag('graphQLTransformer', [
                {
                    name: 'addMissingOwnerFields',
                    type: 'boolean',
                    defaultValueForExistingProjects: false,
                    defaultValueForNewProjects: true,
                },
                {
                    name: 'improvePluralization',
                    type: 'boolean',
                    defaultValueForExistingProjects: false,
                    defaultValueForNewProjects: false,
                },
                {
                    name: 'validateTypeNameReservedWords',
                    type: 'boolean',
                    defaultValueForExistingProjects: true,
                    defaultValueForNewProjects: true,
                },
                {
                    name: 'useExperimentalPipelinedTransformer',
                    type: 'boolean',
                    defaultValueForExistingProjects: false,
                    defaultValueForNewProjects: true,
                },
                {
                    name: 'enableIterativeGSIUpdates',
                    type: 'boolean',
                    defaultValueForExistingProjects: false,
                    defaultValueForNewProjects: true,
                },
                {
                    name: 'secondaryKeyAsGSI',
                    type: 'boolean',
                    defaultValueForExistingProjects: false,
                    defaultValueForNewProjects: true,
                },
                {
                    name: 'skipOverrideMutationInputTypes',
                    type: 'boolean',
                    defaultValueForExistingProjects: false,
                    defaultValueForNewProjects: true,
                },
                {
                    name: 'transformerVersion',
                    type: 'number',
                    defaultValueForExistingProjects: 1,
                    defaultValueForNewProjects: 2,
                },
                {
                    name: 'suppressSchemaMigrationPrompt',
                    type: 'boolean',
                    defaultValueForExistingProjects: true,
                    defaultValueForNewProjects: true,
                },
                {
                    name: 'securityEnhancementNotification',
                    type: 'boolean',
                    defaultValueForExistingProjects: true,
                    defaultValueForNewProjects: false,
                },
                {
                    name: 'showFieldAuthNotification',
                    type: 'boolean',
                    defaultValueForExistingProjects: true,
                    defaultValueForNewProjects: false,
                },
                {
                    name: 'useSubUsernameForDefaultIdentityClaim',
                    type: 'boolean',
                    defaultValueForExistingProjects: true,
                    defaultValueForNewProjects: true,
                },
                {
                    name: 'useFieldNameForPrimaryKeyConnectionField',
                    type: 'boolean',
                    defaultValueForExistingProjects: false,
                    defaultValueForNewProjects: false,
                },
                {
                    name: 'enableAutoIndexQueryNames',
                    type: 'boolean',
                    defaultValueForExistingProjects: false,
                    defaultValueForNewProjects: true,
                },
                {
                    name: 'respectPrimaryKeyAttributesOnConnectionField',
                    type: 'boolean',
                    defaultValueForExistingProjects: false,
                    defaultValueForNewProjects: true,
                },
                {
                    name: 'shouldDeepMergeDirectiveConfigDefaults',
                    type: 'boolean',
                    defaultValueForExistingProjects: false,
                    defaultValueForNewProjects: false,
                },
                {
                    name: 'populateOwnerFieldForStaticGroupAuth',
                    type: 'boolean',
                    defaultValueForExistingProjects: false,
                    defaultValueForNewProjects: true,
                },
            ]);
            this.registerFlag('frontend-ios', [
                {
                    name: 'enableXcodeIntegration',
                    type: 'boolean',
                    defaultValueForExistingProjects: false,
                    defaultValueForNewProjects: true,
                },
            ]);
            this.registerFlag('auth', [
                {
                    name: 'enableCaseInsensitivity',
                    type: 'boolean',
                    defaultValueForExistingProjects: false,
                    defaultValueForNewProjects: true,
                },
                {
                    name: 'useInclusiveTerminology',
                    type: 'boolean',
                    defaultValueForExistingProjects: false,
                    defaultValueForNewProjects: true,
                },
                {
                    name: 'breakCircularDependency',
                    type: 'boolean',
                    defaultValueForExistingProjects: false,
                    defaultValueForNewProjects: true,
                },
                {
                    name: 'forceAliasAttributes',
                    type: 'boolean',
                    defaultValueForExistingProjects: false,
                    defaultValueForNewProjects: false,
                },
                {
                    name: 'useEnabledMfas',
                    type: 'boolean',
                    defaultValueForExistingProjects: false,
                    defaultValueForNewProjects: true,
                },
            ]);
            this.registerFlag('codegen', [
                {
                    name: 'useAppSyncModelgenPlugin',
                    type: 'boolean',
                    defaultValueForExistingProjects: false,
                    defaultValueForNewProjects: true,
                },
                {
                    name: 'useDocsGeneratorPlugin',
                    type: 'boolean',
                    defaultValueForExistingProjects: false,
                    defaultValueForNewProjects: true,
                },
                {
                    name: 'useTypesGeneratorPlugin',
                    type: 'boolean',
                    defaultValueForExistingProjects: false,
                    defaultValueForNewProjects: true,
                },
                {
                    name: 'cleanGeneratedModelsDirectory',
                    type: 'boolean',
                    defaultValueForExistingProjects: false,
                    defaultValueForNewProjects: true,
                },
                {
                    name: 'retainCaseStyle',
                    type: 'boolean',
                    defaultValueForExistingProjects: false,
                    defaultValueForNewProjects: true,
                },
                {
                    name: 'addTimestampFields',
                    type: 'boolean',
                    defaultValueForExistingProjects: false,
                    defaultValueForNewProjects: true,
                },
                {
                    name: 'handleListNullabilityTransparently',
                    type: 'boolean',
                    defaultValueForExistingProjects: false,
                    defaultValueForNewProjects: true,
                },
                {
                    name: 'emitAuthProvider',
                    type: 'boolean',
                    defaultValueForExistingProjects: false,
                    defaultValueForNewProjects: true,
                },
                {
                    name: 'generateIndexRules',
                    type: 'boolean',
                    defaultValueForExistingProjects: false,
                    defaultValueForNewProjects: true,
                },
                {
                    name: 'enableDartNullSafety',
                    type: 'boolean',
                    defaultValueForExistingProjects: false,
                    defaultValueForNewProjects: true,
                },
                {
                    name: 'generateModelsForLazyLoadAndCustomSelectionSet',
                    type: 'boolean',
                    defaultValueForExistingProjects: false,
                    defaultValueForNewProjects: false,
                },
            ]);
            this.registerFlag('appSync', [
                {
                    name: 'generateGraphQLPermissions',
                    type: 'boolean',
                    defaultValueForExistingProjects: false,
                    defaultValueForNewProjects: true,
                },
            ]);
            this.registerFlag('latestRegionSupport', [
                {
                    name: 'pinpoint',
                    type: 'number',
                    defaultValueForExistingProjects: 0,
                    defaultValueForNewProjects: 1,
                },
                {
                    name: 'translate',
                    type: 'number',
                    defaultValueForExistingProjects: 0,
                    defaultValueForNewProjects: 1,
                },
                {
                    name: 'transcribe',
                    type: 'number',
                    defaultValueForExistingProjects: 0,
                    defaultValueForNewProjects: 1,
                },
                {
                    name: 'rekognition',
                    type: 'number',
                    defaultValueForExistingProjects: 0,
                    defaultValueForNewProjects: 1,
                },
                {
                    name: 'textract',
                    type: 'number',
                    defaultValueForExistingProjects: 0,
                    defaultValueForNewProjects: 1,
                },
                {
                    name: 'comprehend',
                    type: 'number',
                    defaultValueForExistingProjects: 0,
                    defaultValueForNewProjects: 1,
                },
            ]);
            this.registerFlag('project', [
                {
                    name: 'overrides',
                    type: 'boolean',
                    defaultValueForExistingProjects: true,
                    defaultValueForNewProjects: true,
                },
            ]);
        };
    }
}
exports.FeatureFlags = FeatureFlags;
_a = FeatureFlags;
FeatureFlags.initialize = async (environmentProvider, useNewDefaults = false, additionalFlags) => {
    var _b;
    if (typeof jest === 'undefined' && FeatureFlags.instance) {
        throw new Error('FeatureFlags can only be initialized once');
    }
    if (!environmentProvider) {
        throw new Error("'environmentProvider' argument is required");
    }
    const projectPath = (_b = state_manager_1.pathManager.findProjectRoot()) !== null && _b !== void 0 ? _b : process.cwd();
    await FeatureFlags.removeOriginalConfigFile(projectPath);
    const instance = new FeatureFlags(environmentProvider, projectPath, useNewDefaults);
    instance.registerFlags();
    if (additionalFlags) {
        Object.keys(additionalFlags).forEach((sectionName) => {
            const flags = additionalFlags[sectionName];
            instance.registerFlag(sectionName, flags);
        });
    }
    instance.fileValueProvider = new featureFlagFileProvider_1.FeatureFlagFileProvider(environmentProvider, {
        projectPath,
    });
    instance.envValueProvider = new featureFlagEnvironmentProvider_1.FeatureFlagEnvironmentProvider({
        projectPath,
    });
    await instance.loadValues();
    FeatureFlags.instance = instance;
};
FeatureFlags.ensureDefaultFeatureFlags = async (newProject) => {
    FeatureFlags.ensureInitialized();
    let config = state_manager_1.stateManager.getCLIJSON(FeatureFlags.instance.projectPath, undefined, {
        throwIfNotExist: false,
        preserveComments: true,
    });
    if (!config || !config.features) {
        config = {
            ...(config !== null && config !== void 0 ? config : {}),
            features: newProject ? FeatureFlags.getNewProjectDefaults() : FeatureFlags.getExistingProjectDefaults(),
        };
        state_manager_1.stateManager.setCLIJSON(FeatureFlags.instance.projectPath, config);
    }
};
FeatureFlags.ensureFeatureFlag = async (featureFlagSection, featureFlagName) => {
    var _b, _c;
    FeatureFlags.ensureInitialized();
    const config = state_manager_1.stateManager.getCLIJSON(FeatureFlags.instance.projectPath, undefined, {
        throwIfNotExist: false,
        preserveComments: true,
    });
    if (!(config === null || config === void 0 ? void 0 : config.features)) {
        await FeatureFlags.ensureDefaultFeatureFlags(false);
    }
    else if (((_c = (_b = config.features) === null || _b === void 0 ? void 0 : _b[featureFlagSection]) === null || _c === void 0 ? void 0 : _c[featureFlagName]) === undefined) {
        const features = FeatureFlags.getExistingProjectDefaults();
        lodash_1.default.setWith(config, ['features', featureFlagSection, featureFlagName], features[featureFlagSection][featureFlagName]);
        state_manager_1.stateManager.setCLIJSON(FeatureFlags.instance.projectPath, config);
    }
};
FeatureFlags.getBoolean = (flagName) => {
    FeatureFlags.ensureInitialized();
    return FeatureFlags.instance.getValue(flagName, 'boolean');
};
FeatureFlags.getNumber = (flagName) => {
    FeatureFlags.ensureInitialized();
    return FeatureFlags.instance.getValue(flagName, 'number');
};
FeatureFlags.getEffectiveFlags = () => {
    FeatureFlags.ensureInitialized();
    return FeatureFlags.instance.effectiveFlags;
};
FeatureFlags.getNewProjectDefaults = () => {
    FeatureFlags.ensureInitialized();
    return FeatureFlags.instance.newProjectDefaults;
};
FeatureFlags.getExistingProjectDefaults = () => {
    FeatureFlags.ensureInitialized();
    return FeatureFlags.instance.existingProjectDefaults;
};
FeatureFlags.removeFeatureFlagConfiguration = async (removeProjectConfiguration, envNames) => {
    FeatureFlags.ensureInitialized();
    if (!envNames) {
        throw new amplify_fault_1.AmplifyFault('ConfigurationFault', {
            message: 'Environment names could not be loaded or were not provided.',
        });
    }
    if (removeProjectConfiguration) {
        const configFileName = state_manager_1.pathManager.getCLIJSONFilePath(FeatureFlags.instance.projectPath);
        await fs.remove(configFileName);
    }
    for (const envName of envNames) {
        const configFileName = state_manager_1.pathManager.getCLIJSONFilePath(FeatureFlags.instance.projectPath, envName);
        await fs.remove(configFileName);
    }
};
FeatureFlags.isInitialized = () => FeatureFlags.instance !== undefined;
FeatureFlags.reloadValues = async () => {
    FeatureFlags.ensureInitialized();
    await FeatureFlags.instance.loadValues();
};
FeatureFlags.removeOriginalConfigFile = async (projectPath) => {
    const originalConfigFileName = 'amplify.json';
    try {
        if (!projectPath) {
            return;
        }
        const originalConfigFilePath = path.join(projectPath, originalConfigFileName);
        const configFileData = jsonUtilities_1.JSONUtilities.readJson(originalConfigFilePath, {
            throwIfNotExist: false,
        });
        if ((configFileData === null || configFileData === void 0 ? void 0 : configFileData.features) !== undefined) {
            fs.removeSync(originalConfigFilePath);
        }
    }
    catch (_b) {
    }
};
FeatureFlags.ensureInitialized = () => {
    if (!FeatureFlags.instance) {
        throw new Error('FeatureFlags is not initialized');
    }
};
//# sourceMappingURL=featureFlags.js.map