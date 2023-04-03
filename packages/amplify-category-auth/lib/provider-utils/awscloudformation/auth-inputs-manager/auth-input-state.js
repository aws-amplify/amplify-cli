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
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _AuthInputState_cliInputsFilePath, _AuthInputState_resourceName, _AuthInputState_category, _AuthInputState_service, _AuthInputState_buildFilePath;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthInputState = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const lodash_1 = __importDefault(require("lodash"));
class AuthInputState extends amplify_cli_core_1.CategoryInputState {
    constructor(context, resourceName) {
        super(resourceName);
        this.context = context;
        _AuthInputState_cliInputsFilePath.set(this, void 0);
        _AuthInputState_resourceName.set(this, void 0);
        _AuthInputState_category.set(this, void 0);
        _AuthInputState_service.set(this, void 0);
        _AuthInputState_buildFilePath.set(this, void 0);
        __classPrivateFieldSet(this, _AuthInputState_category, amplify_cli_core_1.AmplifyCategories.AUTH, "f");
        __classPrivateFieldSet(this, _AuthInputState_service, amplify_cli_core_1.AmplifySupportedService.COGNITO, "f");
        __classPrivateFieldSet(this, _AuthInputState_resourceName, resourceName, "f");
        const projectBackendDirPath = amplify_cli_core_1.pathManager.getBackendDirPath();
        __classPrivateFieldSet(this, _AuthInputState_cliInputsFilePath, path.resolve(path.join(projectBackendDirPath, amplify_cli_core_1.AmplifyCategories.AUTH, resourceName, 'cli-inputs.json')), "f");
        __classPrivateFieldSet(this, _AuthInputState_buildFilePath, path.resolve(path.join(projectBackendDirPath, amplify_cli_core_1.AmplifyCategories.AUTH, resourceName, 'build')), "f");
    }
    async isCLIInputsValid(cliInputs = this.getCLIInputPayload()) {
        const schemaValidator = new amplify_cli_core_1.CLIInputSchemaValidator(this.context, __classPrivateFieldGet(this, _AuthInputState_service, "f"), __classPrivateFieldGet(this, _AuthInputState_category, "f"), 'CognitoCLIInputs');
        return schemaValidator.validateInput(JSON.stringify(cliInputs));
    }
    getCLIInputPayload() {
        return amplify_cli_core_1.JSONUtilities.readJson(__classPrivateFieldGet(this, _AuthInputState_cliInputsFilePath, "f"), { throwIfNotExist: true });
    }
    cliInputFileExists() {
        return fs.existsSync(__classPrivateFieldGet(this, _AuthInputState_cliInputsFilePath, "f"));
    }
    async saveCLIInputPayload(cliInputs) {
        if (!lodash_1.default.isEmpty(cliInputs.cognitoConfig.triggers)) {
            cliInputs.cognitoConfig.triggers =
                typeof cliInputs.cognitoConfig.triggers === 'string'
                    ? amplify_cli_core_1.JSONUtilities.parse(cliInputs.cognitoConfig.triggers)
                    : cliInputs.cognitoConfig.triggers;
        }
        if (await this.isCLIInputsValid(cliInputs)) {
            fs.ensureDirSync(path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), __classPrivateFieldGet(this, _AuthInputState_category, "f"), this._resourceName));
            amplify_cli_core_1.JSONUtilities.writeJson(__classPrivateFieldGet(this, _AuthInputState_cliInputsFilePath, "f"), cliInputs);
        }
    }
    async loadResourceParameters(context, cliInputs) {
        const roles = {
            authRoleArn: {
                'Fn::GetAtt': ['AuthRole', 'Arn'],
            },
            unauthRoleArn: {
                'Fn::GetAtt': ['UnauthRole', 'Arn'],
            },
        };
        let parameters = {
            ...cliInputs.cognitoConfig,
            ...roles,
            breakCircularDependency: amplify_cli_core_1.FeatureFlags.getBoolean('auth.breakcirculardependency'),
            dependsOn: [],
        };
        if (!lodash_1.default.isEmpty(parameters.triggers)) {
            parameters.triggers = JSON.stringify(parameters.triggers);
            let dependsOn;
            if (parameters.dependsOn && !lodash_1.default.isEmpty(parameters.dependsOn)) {
                dependsOn = parameters.dependsOn;
            }
            else {
                const dependsOnKeys = Object.keys(parameters.triggers).map((i) => `${parameters.resourceName}${i}`);
                dependsOn = context.amplify.dependsOnBlock(context, dependsOnKeys, 'Cognito');
            }
            parameters = Object.assign(parameters, {
                triggers: parameters.triggers,
                dependsOn,
            });
        }
        else {
            if (parameters.triggers) {
                parameters.triggers = JSON.stringify(parameters.triggers);
            }
        }
        return parameters;
    }
}
exports.AuthInputState = AuthInputState;
_AuthInputState_cliInputsFilePath = new WeakMap(), _AuthInputState_resourceName = new WeakMap(), _AuthInputState_category = new WeakMap(), _AuthInputState_service = new WeakMap(), _AuthInputState_buildFilePath = new WeakMap();
//# sourceMappingURL=auth-input-state.js.map