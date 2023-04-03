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
exports.DynamoDBInputState = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const cfn_template_utils_1 = require("../cfn-template-utils");
class DynamoDBInputState {
    constructor(context, resourceName) {
        this.context = context;
        this._category = amplify_cli_core_1.AmplifyCategories.STORAGE;
        this._service = amplify_cli_core_1.AmplifySupportedService.DYNAMODB;
        this._resourceName = resourceName;
        const projectBackendDirPath = amplify_cli_core_1.pathManager.getBackendDirPath();
        this._cliInputsFilePath = path.resolve(path.join(projectBackendDirPath, amplify_cli_core_1.AmplifyCategories.STORAGE, resourceName, 'cli-inputs.json'));
        this.buildFilePath = path.resolve(path.join(projectBackendDirPath, amplify_cli_core_1.AmplifyCategories.STORAGE, resourceName, 'build'));
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
    cliInputFileExists() {
        return fs.existsSync(this._cliInputsFilePath);
    }
    async isCLIInputsValid(cliInputs) {
        if (!cliInputs) {
            cliInputs = this.getCliInputPayload();
        }
        const schemaValidator = new amplify_cli_core_1.CLIInputSchemaValidator(this.context, this._service, this._category, 'DynamoDBCLIInputs');
        await schemaValidator.validateInput(JSON.stringify(cliInputs));
    }
    async saveCliInputPayload(cliInputs) {
        await this.isCLIInputsValid(cliInputs);
        fs.ensureDirSync(amplify_cli_core_1.pathManager.getResourceDirectoryPath(undefined, this._category, this._resourceName));
        try {
            amplify_cli_core_1.JSONUtilities.writeJson(this._cliInputsFilePath, cliInputs);
        }
        catch (e) {
            throw new Error(e);
        }
    }
    async migrate() {
        var _a, _b, _c;
        const backendDir = amplify_cli_core_1.pathManager.getBackendDirPath();
        const oldParametersFilepath = path.join(backendDir, 'storage', this._resourceName, 'parameters.json');
        const oldCFNFilepath = path.join(backendDir, 'storage', this._resourceName, `${this._resourceName}-cloudformation-template.json`);
        const oldStorageParamsFilepath = path.join(backendDir, 'storage', this._resourceName, `storage-params.json`);
        const oldParameters = amplify_cli_core_1.JSONUtilities.readJson(oldParametersFilepath, { throwIfNotExist: true });
        const oldCFN = amplify_cli_core_1.JSONUtilities.readJson(oldCFNFilepath, { throwIfNotExist: true });
        const oldStorageParams = amplify_cli_core_1.JSONUtilities.readJson(oldStorageParamsFilepath, { throwIfNotExist: false }) || {};
        const partitionKey = {
            fieldName: oldParameters.partitionKeyName,
            fieldType: (0, cfn_template_utils_1.getFieldType)(oldParameters.partitionKeyType),
        };
        let sortKey;
        if (oldParameters.sortKeyName) {
            sortKey = {
                fieldName: oldParameters.sortKeyName,
                fieldType: (0, cfn_template_utils_1.getFieldType)(oldParameters.sortKeyType),
            };
        }
        let triggerFunctions = [];
        if (oldStorageParams.triggerFunctions) {
            triggerFunctions = oldStorageParams.triggerFunctions;
        }
        const getType = (attrList, attrName) => {
            let attrType;
            attrList.forEach((attr) => {
                if (attr.AttributeName === attrName) {
                    attrType = (0, cfn_template_utils_1.getFieldType)(attr.AttributeType);
                }
            });
            return attrType;
        };
        const gsi = [];
        if ((_c = (_b = (_a = oldCFN === null || oldCFN === void 0 ? void 0 : oldCFN.Resources) === null || _a === void 0 ? void 0 : _a.DynamoDBTable) === null || _b === void 0 ? void 0 : _b.Properties) === null || _c === void 0 ? void 0 : _c.GlobalSecondaryIndexes) {
            oldCFN.Resources.DynamoDBTable.Properties.GlobalSecondaryIndexes.forEach((cfnGSIValue) => {
                const gsiValue = {};
                (gsiValue.name = cfnGSIValue.IndexName),
                    cfnGSIValue.KeySchema.forEach((keySchema) => {
                        if (keySchema.KeyType === 'HASH') {
                            gsiValue.partitionKey = {
                                fieldName: keySchema.AttributeName,
                                fieldType: getType(oldCFN.Resources.DynamoDBTable.Properties.AttributeDefinitions, keySchema.AttributeName),
                            };
                        }
                        else {
                            gsiValue.sortKey = {
                                fieldName: keySchema.AttributeName,
                                fieldType: getType(oldCFN.Resources.DynamoDBTable.Properties.AttributeDefinitions, keySchema.AttributeName),
                            };
                        }
                    });
                gsi.push(gsiValue);
            });
        }
        const cliInputs = {
            resourceName: this._resourceName,
            tableName: oldParameters.tableName,
            partitionKey,
            sortKey,
            triggerFunctions,
            gsi,
        };
        await this.saveCliInputPayload(cliInputs);
        if (fs.existsSync(oldCFNFilepath)) {
            fs.removeSync(oldCFNFilepath);
        }
        if (fs.existsSync(oldParametersFilepath)) {
            fs.removeSync(oldParametersFilepath);
        }
        if (fs.existsSync(oldStorageParamsFilepath)) {
            fs.removeSync(oldStorageParamsFilepath);
        }
    }
}
exports.DynamoDBInputState = DynamoDBInputState;
//# sourceMappingURL=dynamoDB-input-state.js.map