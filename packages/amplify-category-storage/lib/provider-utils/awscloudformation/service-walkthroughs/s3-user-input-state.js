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
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3InputState = exports.canResourceBeTransformed = exports.S3StorageParamsPermissionType = exports.S3CFNPermissionType = void 0;
const lodash_1 = __importDefault(require("lodash"));
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const s3_user_input_types_1 = require("../service-walkthrough-types/s3-user-input-types");
const s3_auth_api_1 = require("./s3-auth-api");
const s3_walkthrough_1 = require("./s3-walkthrough");
var S3CFNPermissionType;
(function (S3CFNPermissionType) {
    S3CFNPermissionType["CREATE"] = "s3:PutObject";
    S3CFNPermissionType["READ"] = "s3:GetObject";
    S3CFNPermissionType["DELETE"] = "s3:DeleteObject";
    S3CFNPermissionType["LIST"] = "s3:ListBucket";
})(S3CFNPermissionType = exports.S3CFNPermissionType || (exports.S3CFNPermissionType = {}));
var S3StorageParamsPermissionType;
(function (S3StorageParamsPermissionType) {
    S3StorageParamsPermissionType["CREATE_AND_UPDATE"] = "create/update";
    S3StorageParamsPermissionType["READ"] = "read";
    S3StorageParamsPermissionType["DELETE"] = "delete";
})(S3StorageParamsPermissionType = exports.S3StorageParamsPermissionType || (exports.S3StorageParamsPermissionType = {}));
function canResourceBeTransformed(context, resourceName) {
    const resourceInputState = new S3InputState(context, resourceName, undefined);
    return resourceInputState.cliInputFileExists();
}
exports.canResourceBeTransformed = canResourceBeTransformed;
class S3InputState {
    constructor(context, resourceName, userInput) {
        this.context = context;
        this._category = amplify_cli_core_1.AmplifyCategories.STORAGE;
        this._service = amplify_cli_core_1.AmplifySupportedService.S3;
        const projectBackendDirPath = amplify_cli_core_1.pathManager.getBackendDirPath();
        this._cliInputsFilePath = path.resolve(path.join(projectBackendDirPath, amplify_cli_core_1.AmplifyCategories.STORAGE, resourceName, 'cli-inputs.json'));
        this._resourceName = resourceName;
        this.buildFilePath = path.resolve(path.join(projectBackendDirPath, amplify_cli_core_1.AmplifyCategories.STORAGE, resourceName, 'build'));
        if (userInput) {
            this._inputPayload = userInput;
        }
        else {
            if (this.cliInputFileExists()) {
                this._inputPayload = this.getCliInputPayload();
            }
            else {
                return;
            }
        }
        void this.isCLIInputsValid(this._inputPayload);
    }
    getOldS3ParamsForMigration() {
        const backendDir = amplify_cli_core_1.pathManager.getBackendDirPath();
        const oldParametersFilepath = path.join(backendDir, amplify_cli_core_1.AmplifyCategories.STORAGE, this._resourceName, 'parameters.json');
        const oldCFNFilepath = path.join(backendDir, amplify_cli_core_1.AmplifyCategories.STORAGE, this._resourceName, 's3-cloudformation-template.json');
        const oldStorageParamsFilepath = path.join(backendDir, amplify_cli_core_1.AmplifyCategories.STORAGE, this._resourceName, `storage-params.json`);
        const oldParameters = amplify_cli_core_1.JSONUtilities.readJson(oldParametersFilepath, { throwIfNotExist: true });
        const oldCFN = amplify_cli_core_1.JSONUtilities.readJson(oldCFNFilepath, { throwIfNotExist: true });
        const oldStorageParams = amplify_cli_core_1.JSONUtilities.readJson(oldStorageParamsFilepath, { throwIfNotExist: false }) || {};
        const oldParams = {
            parametersFilepath: oldParametersFilepath,
            cfnFilepath: oldCFNFilepath,
            storageParamsFilepath: oldStorageParamsFilepath,
            parameters: oldParameters,
            cfn: oldCFN,
            storageParams: oldStorageParams,
        };
        return oldParams;
    }
    inferAuthPermissions(oldParams) {
        if (oldParams.selectedAuthenticatedPermissions &&
            ((oldParams.s3PermissionsAuthenticatedPublic && oldParams.s3PermissionsAuthenticatedPublic != 'DISALLOW') ||
                (oldParams.s3PermissionsAuthenticatedPrivate && oldParams.s3PermissionsAuthenticatedPrivate != 'DISALLOW') ||
                (oldParams.s3PermissionsAuthenticatedProtected && oldParams.s3PermissionsAuthenticatedProtected != 'DISALLOW') ||
                (oldParams.s3PermissionsAuthenticatedUploads && oldParams.s3PermissionsAuthenticatedUploads != 'DISALLOW'))) {
            return oldParams.selectedAuthenticatedPermissions;
        }
        else {
            return [];
        }
    }
    inferGuestPermissions(oldParams) {
        if (oldParams.selectedGuestPermissions &&
            ((oldParams.s3PermissionsGuestPublic && oldParams.s3PermissionsGuestPublic != 'DISALLOW') ||
                (oldParams.s3PermissionsGuestPrivate && oldParams.s3PermissionsGuestPrivate != 'DISALLOW') ||
                (oldParams.s3PermissionsGuestProtected && oldParams.s3PermissionsGuestProtected != 'DISALLOW') ||
                (oldParams.s3PermissionsGuestUploads && oldParams.s3PermissionsGuestUploads != 'DISALLOW'))) {
            return oldParams.selectedGuestPermissions;
        }
        else {
            return [];
        }
    }
    genInputParametersForMigration(oldS3Params) {
        var _a, _b;
        const oldParams = oldS3Params.parameters;
        const storageParams = oldS3Params.storageParams;
        const userInputs = {
            resourceName: this._resourceName,
            bucketName: oldParams.bucketName,
            policyUUID: (0, s3_walkthrough_1.buildShortUUID)(),
            storageAccess: s3_user_input_types_1.S3AccessType.AUTH_ONLY,
            guestAccess: [],
            authAccess: [],
            triggerFunction: 'NONE',
            groupAccess: undefined,
        };
        const authPermissions = this.inferAuthPermissions(oldParams);
        const guestPermissions = this.inferGuestPermissions(oldParams);
        if (oldParams.triggerFunction) {
            userInputs.triggerFunction = oldParams.triggerFunction;
        }
        if (authPermissions && authPermissions.length > 0) {
            userInputs.authAccess = S3InputState.getInputPermissionsFromCfnPermissions(authPermissions);
        }
        else {
            userInputs.authAccess = [];
        }
        if (guestPermissions && guestPermissions.length > 0) {
            userInputs.guestAccess = S3InputState.getInputPermissionsFromCfnPermissions(guestPermissions);
        }
        else {
            userInputs.guestAccess = [];
        }
        if (((_a = userInputs.guestAccess) === null || _a === void 0 ? void 0 : _a.length) > 0) {
            userInputs.storageAccess = s3_user_input_types_1.S3AccessType.AUTH_AND_GUEST;
        }
        else {
            if (((_b = userInputs.authAccess) === null || _b === void 0 ? void 0 : _b.length) > 0) {
                userInputs.storageAccess = s3_user_input_types_1.S3AccessType.AUTH_ONLY;
            }
        }
        if (storageParams && Object.prototype.hasOwnProperty.call(storageParams, 'groupPermissionMap')) {
            userInputs.groupAccess = S3InputState.getPolicyMapFromStorageParamPolicyMap(storageParams.groupPermissionMap);
        }
        return userInputs;
    }
    removeOldS3ConfigFiles(migrationParams) {
        if (fs.existsSync(migrationParams.cfnFilepath)) {
            fs.removeSync(migrationParams.cfnFilepath);
        }
        if (fs.existsSync(migrationParams.parametersFilepath)) {
            fs.removeSync(migrationParams.parametersFilepath);
        }
        if (fs.existsSync(migrationParams.storageParamsFilepath)) {
            fs.removeSync(migrationParams.storageParamsFilepath);
        }
    }
    checkNeedsMigration() {
        const backendDir = amplify_cli_core_1.pathManager.getBackendDirPath();
        const oldParametersFilepath = path.join(backendDir, amplify_cli_core_1.AmplifyCategories.STORAGE, this._resourceName, 'parameters.json');
        const oldCFNFilepath = path.join(backendDir, amplify_cli_core_1.AmplifyCategories.STORAGE, this._resourceName, 's3-cloudformation-template.json');
        return fs.existsSync(oldParametersFilepath) && fs.existsSync(oldCFNFilepath);
    }
    async migrate(context) {
        if (!this.checkNeedsMigration()) {
            return;
        }
        try {
            const authMigrationAccepted = await (0, s3_auth_api_1.migrateAuthDependencyResource)(context);
            if (!authMigrationAccepted) {
                (0, amplify_cli_core_1.exitOnNextTick)(0);
            }
        }
        catch (error) {
            amplify_prompts_1.printer.error(`Migration for Auth resource failed with error : ${error}`);
            throw error;
        }
        const oldS3Params = this.getOldS3ParamsForMigration();
        const cliInputs = this.genInputParametersForMigration(oldS3Params);
        await this.saveCliInputPayload(cliInputs);
        this.removeOldS3ConfigFiles(oldS3Params);
    }
    cliInputFileExists() {
        return fs.existsSync(this._cliInputsFilePath);
    }
    checkPrefixExists(triggerPrefixList, prefix) {
        for (const triggerPrefix of triggerPrefixList) {
            if (triggerPrefix.prefix === prefix) {
                return true;
            }
        }
        return false;
    }
    _confirmLambdaTriggerPrefixUnique(triggerFunctionName, triggerPrefixList) {
        var _a;
        if ((_a = this._inputPayload) === null || _a === void 0 ? void 0 : _a.additionalTriggerFunctions) {
            for (const triggerParams of this._inputPayload.additionalTriggerFunctions) {
                if (triggerParams.triggerPrefix) {
                    for (const configuredTriggerPrefix of triggerParams.triggerPrefix) {
                        if (this.checkPrefixExists(triggerPrefixList, configuredTriggerPrefix.prefix) &&
                            triggerParams.triggerFunction !== triggerFunctionName) {
                            throw new Error(`Error installing additional Lambda Trigger : trigger ${triggerParams.triggerFunction} already configured on prefix ${triggerParams.triggerPrefix}`);
                        }
                    }
                }
            }
        }
        return true;
    }
    addAdminLambdaTrigger(adminLambdaTrigger) {
        if (this._inputPayload) {
            this._inputPayload.adminTriggerFunction = adminLambdaTrigger;
        }
        else {
            throw new Error('Error : Admin Lambda Trigger cannot be installed because S3 resource CLI Input is not initialized.');
        }
    }
    removeAdminLambdaTrigger() {
        if (this._inputPayload) {
            this._inputPayload.adminTriggerFunction = undefined;
        }
        else {
            throw new Error('Error : Admin Lambda Trigger cannot be installed because S3 resource CLI Input is not initialized.');
        }
    }
    addAdditionalLambdaTrigger(triggerFunctionParams) {
        let additionalTriggerFunctions = [];
        if (!this._inputPayload) {
            throw new Error(`Error installing additional Lambda Trigger : Storage resource ${this._resourceName} not configured`);
        }
        if (triggerFunctionParams.triggerPrefix) {
            this._confirmLambdaTriggerPrefixUnique(triggerFunctionParams.triggerFunction, triggerFunctionParams.triggerPrefix);
        }
        if (this._inputPayload.additionalTriggerFunctions) {
            let functionExists = false;
            const existingTriggerFunctions = this._inputPayload.additionalTriggerFunctions;
            additionalTriggerFunctions = existingTriggerFunctions === null || existingTriggerFunctions === void 0 ? void 0 : existingTriggerFunctions.map((functionParams) => {
                if (functionParams.triggerPrefix === triggerFunctionParams.triggerPrefix &&
                    functionParams.triggerFunction === triggerFunctionParams.triggerFunction) {
                    functionExists = true;
                    return triggerFunctionParams;
                }
                else {
                    return functionParams;
                }
            });
            if (functionExists == false && additionalTriggerFunctions && additionalTriggerFunctions.length > 0) {
                additionalTriggerFunctions.push(triggerFunctionParams);
            }
        }
        else {
            additionalTriggerFunctions = [triggerFunctionParams];
        }
        this._inputPayload.additionalTriggerFunctions = additionalTriggerFunctions;
    }
    getUserInput() {
        if (this._inputPayload) {
            return this._inputPayload;
        }
        else {
            try {
                this._inputPayload = this.getCliInputPayload();
            }
            catch (e) {
                throw new Error('cli-inputs.json file missing from the resource directory');
            }
        }
        return this._inputPayload;
    }
    async isCLIInputsValid(cliInputs) {
        if (!cliInputs) {
            cliInputs = this.getCliInputPayload();
        }
        const schemaValidator = new amplify_cli_core_1.CLIInputSchemaValidator(this.context, this._service, this._category, 'S3UserInputs');
        return await schemaValidator.validateInput(JSON.stringify(cliInputs));
    }
    static getPermissionTypeFromCfnType(s3CFNPermissionType) {
        switch (s3CFNPermissionType) {
            case S3CFNPermissionType.CREATE:
                return s3_user_input_types_1.S3PermissionType.CREATE_AND_UPDATE;
            case S3CFNPermissionType.READ:
            case S3CFNPermissionType.LIST:
                return s3_user_input_types_1.S3PermissionType.READ;
            case S3CFNPermissionType.DELETE:
                return s3_user_input_types_1.S3PermissionType.DELETE;
            default:
                throw new Error(`Unknown CFN Type: ${s3CFNPermissionType}`);
        }
    }
    static getPermissionTypeFromStorageParamsType(s3StorageParamsPermissionType) {
        switch (s3StorageParamsPermissionType) {
            case S3StorageParamsPermissionType.CREATE_AND_UPDATE:
                return s3_user_input_types_1.S3PermissionType.CREATE_AND_UPDATE;
            case S3StorageParamsPermissionType.READ:
                return s3_user_input_types_1.S3PermissionType.READ;
            case S3StorageParamsPermissionType.DELETE:
                return s3_user_input_types_1.S3PermissionType.DELETE;
            default:
                throw new Error(`Unknown Storage Param Type: ${s3StorageParamsPermissionType}`);
        }
    }
    static getCfnTypesFromPermissionType(s3PermissionType) {
        switch (s3PermissionType) {
            case s3_user_input_types_1.S3PermissionType.CREATE_AND_UPDATE:
                return [S3CFNPermissionType.CREATE];
            case s3_user_input_types_1.S3PermissionType.READ:
                return [S3CFNPermissionType.READ, S3CFNPermissionType.LIST];
            case s3_user_input_types_1.S3PermissionType.DELETE:
                return [S3CFNPermissionType.DELETE];
            default:
                throw new Error(`Unknown Permission Type: ${s3PermissionType}`);
        }
    }
    static getInputPermissionsFromCfnPermissions(selectedGuestPermissions) {
        if (selectedGuestPermissions && selectedGuestPermissions.length > 0) {
            const inputParams = selectedGuestPermissions.map(S3InputState.getPermissionTypeFromCfnType);
            return lodash_1.default.uniq(inputParams);
        }
        else {
            return [];
        }
    }
    static getInputPermissionsFromStorageParamPermissions(storageParamGroupPermissions) {
        if (storageParamGroupPermissions && storageParamGroupPermissions.length > 0) {
            return storageParamGroupPermissions.map(S3InputState.getPermissionTypeFromStorageParamsType);
        }
        else {
            return [];
        }
    }
    static getTriggerLambdaPermissionsFromInputPermission(triggerPermissions) {
        switch (triggerPermissions) {
            case s3_user_input_types_1.S3PermissionType.CREATE_AND_UPDATE:
                return s3_user_input_types_1.S3TriggerEventType.OBJ_PUT_POST_COPY;
            case s3_user_input_types_1.S3PermissionType.DELETE:
                return s3_user_input_types_1.S3TriggerEventType.OBJ_REMOVED;
        }
        throw new Error(`Unknown Trigger Lambda Permission Type ${triggerPermissions}`);
    }
    static getCfnPermissionsFromInputPermissions(selectedPermissions) {
        if (selectedPermissions && selectedPermissions.length > 0) {
            let selectedCfnPermissions = [];
            for (const selectedPermission of selectedPermissions) {
                selectedCfnPermissions = selectedCfnPermissions.concat(S3InputState.getCfnTypesFromPermissionType(selectedPermission));
            }
            return selectedCfnPermissions;
        }
        else {
            return [];
        }
    }
    static getPolicyMapFromCfnPolicyMap(groupCFNPolicyMap) {
        if (groupCFNPolicyMap) {
            const result = {};
            for (const groupName of Object.keys(groupCFNPolicyMap)) {
                result[groupName] = S3InputState.getInputPermissionsFromCfnPermissions(groupCFNPolicyMap[groupName]);
            }
            return result;
        }
        else {
            return undefined;
        }
    }
    static getPolicyMapFromStorageParamPolicyMap(groupStorageParamsPolicyMap) {
        if (groupStorageParamsPolicyMap) {
            const result = {};
            for (const groupName of Object.keys(groupStorageParamsPolicyMap)) {
                result[groupName] = S3InputState.getInputPermissionsFromStorageParamPermissions(groupStorageParamsPolicyMap[groupName]);
            }
            return result;
        }
        else {
            return undefined;
        }
    }
    static getPolicyMapFromStorageParamsPolicyMap(groupStorageParamsPolicyMap) {
        if (groupStorageParamsPolicyMap) {
            const result = {};
            for (const groupName of Object.keys(groupStorageParamsPolicyMap)) {
                result[groupName] = S3InputState.getInputPermissionsFromStorageParamPermissions(groupStorageParamsPolicyMap[groupName]);
            }
            return result;
        }
        else {
            return undefined;
        }
    }
    async updateInputPayload(props) {
        this._inputPayload = props.inputPayload;
        const schemaValidator = new amplify_cli_core_1.CLIInputSchemaValidator(this.context, this._service, this._category, 'S3UserInputs');
        await schemaValidator.validateInput(JSON.stringify(this._inputPayload));
    }
    static async getInstance(context, props) {
        if (!S3InputState.s3InputState) {
            S3InputState.s3InputState = new S3InputState(context, props.resourceName, props.inputPayload);
        }
        if (props.inputPayload) {
            await S3InputState.s3InputState.updateInputPayload(props);
        }
        return S3InputState.s3InputState;
    }
    getCliInputPayload() {
        let cliInputs;
        try {
            cliInputs = amplify_cli_core_1.JSONUtilities.readJson(this._cliInputsFilePath);
        }
        catch (e) {
            throw new Error('cli-inputs.json file missing from the resource directory');
        }
        return cliInputs;
    }
    getCliMetadata() {
        return undefined;
    }
    async saveCliInputPayload(cliInputs) {
        await this.isCLIInputsValid(cliInputs);
        this._inputPayload = cliInputs;
        fs.ensureDirSync(path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), this._category, this._resourceName));
        amplify_cli_core_1.JSONUtilities.writeJson(this._cliInputsFilePath, cliInputs);
    }
}
exports.S3InputState = S3InputState;
//# sourceMappingURL=s3-user-input-state.js.map