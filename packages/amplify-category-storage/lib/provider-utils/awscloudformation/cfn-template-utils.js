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
exports.getDdbAttrType = exports.getFieldType = exports.DdbAttrType = exports.getExistingTableColumnNames = exports.getExistingStorageAttributeDefinitions = exports.getExistingStorageGSIs = exports.getCloudFormationTemplatePath = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const lodash_1 = __importDefault(require("lodash"));
const path = __importStar(require("path"));
const amplify_cli_core_2 = require("amplify-cli-core");
const dynamoDB_user_input_types_1 = require("./service-walkthrough-types/dynamoDB-user-input-types");
const getCloudFormationTemplatePath = (resourceName) => {
    return path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), amplify_cli_core_2.AmplifyCategories.STORAGE, resourceName, `${resourceName}-cloudformation-template.json`);
};
exports.getCloudFormationTemplatePath = getCloudFormationTemplatePath;
const getExistingStorageGSIs = async (resourceName) => {
    var _a, _b;
    return ((_b = (_a = (await loadTable(resourceName))) === null || _a === void 0 ? void 0 : _a.Properties) === null || _b === void 0 ? void 0 : _b.GlobalSecondaryIndexes) || [];
};
exports.getExistingStorageGSIs = getExistingStorageGSIs;
const getExistingStorageAttributeDefinitions = async (resourceName) => {
    var _a, _b;
    return ((_b = (_a = (await loadTable(resourceName))) === null || _a === void 0 ? void 0 : _a.Properties) === null || _b === void 0 ? void 0 : _b.AttributeDefinitions) || [];
};
exports.getExistingStorageAttributeDefinitions = getExistingStorageAttributeDefinitions;
const getExistingTableColumnNames = async (resourceName) => {
    return (await (0, exports.getExistingStorageAttributeDefinitions)(resourceName)).map((att) => att.AttributeName.toString());
};
exports.getExistingTableColumnNames = getExistingTableColumnNames;
const loadTable = async (resourceName) => {
    const table = getTableFromTemplate(await loadCfnTemplateSafe(resourceName));
    return table;
};
const loadCfnTemplateSafe = async (resourceName) => {
    if (!resourceName) {
        return undefined;
    }
    const { cfnTemplate } = (0, amplify_cli_core_1.readCFNTemplate)((0, exports.getCloudFormationTemplatePath)(resourceName), { throwIfNotExist: false }) || {};
    return cfnTemplate;
};
const getTableFromTemplate = (cfnTemplate) => {
    if (lodash_1.default.isEmpty(cfnTemplate === null || cfnTemplate === void 0 ? void 0 : cfnTemplate.Resources)) {
        return undefined;
    }
    const cfnTable = Object.values(cfnTemplate.Resources).find((resource) => resource.Type === 'AWS::DynamoDB::Table');
    return cfnTable;
};
var DdbAttrType;
(function (DdbAttrType) {
    DdbAttrType["S"] = "S";
    DdbAttrType["N"] = "N";
    DdbAttrType["B"] = "B";
    DdbAttrType["BOOL"] = "BOOL";
    DdbAttrType["NULL"] = "NULL";
    DdbAttrType["L"] = "L";
    DdbAttrType["M"] = "M";
    DdbAttrType["SS"] = "SS";
    DdbAttrType["NS"] = "NS";
    DdbAttrType["BS"] = "BS";
})(DdbAttrType = exports.DdbAttrType || (exports.DdbAttrType = {}));
const ddbAttrToFieldType = {
    [DdbAttrType.S]: dynamoDB_user_input_types_1.FieldType.string,
    [DdbAttrType.N]: dynamoDB_user_input_types_1.FieldType.number,
    [DdbAttrType.B]: dynamoDB_user_input_types_1.FieldType.binary,
    [DdbAttrType.BOOL]: dynamoDB_user_input_types_1.FieldType.boolean,
    [DdbAttrType.NULL]: dynamoDB_user_input_types_1.FieldType.null,
    [DdbAttrType.L]: dynamoDB_user_input_types_1.FieldType.list,
    [DdbAttrType.M]: dynamoDB_user_input_types_1.FieldType.map,
    [DdbAttrType.SS]: dynamoDB_user_input_types_1.FieldType.stringSet,
    [DdbAttrType.NS]: dynamoDB_user_input_types_1.FieldType.numberSet,
    [DdbAttrType.BS]: dynamoDB_user_input_types_1.FieldType.binarySet,
};
const fieldTypeToDdbAttr = {
    [dynamoDB_user_input_types_1.FieldType.string]: DdbAttrType.S,
    [dynamoDB_user_input_types_1.FieldType.number]: DdbAttrType.N,
    [dynamoDB_user_input_types_1.FieldType.binary]: DdbAttrType.B,
    [dynamoDB_user_input_types_1.FieldType.boolean]: DdbAttrType.BOOL,
    [dynamoDB_user_input_types_1.FieldType.null]: DdbAttrType.NULL,
    [dynamoDB_user_input_types_1.FieldType.list]: DdbAttrType.L,
    [dynamoDB_user_input_types_1.FieldType.map]: DdbAttrType.M,
    [dynamoDB_user_input_types_1.FieldType.stringSet]: DdbAttrType.SS,
    [dynamoDB_user_input_types_1.FieldType.numberSet]: DdbAttrType.NS,
    [dynamoDB_user_input_types_1.FieldType.binarySet]: DdbAttrType.BS,
};
const getFieldType = (ddbAttr) => {
    const result = ddbAttrToFieldType[ddbAttr];
    if (!result) {
        throw new Error(`Unknown DDB attribute type ${ddbAttr}`);
    }
    return result;
};
exports.getFieldType = getFieldType;
const getDdbAttrType = (fieldType) => {
    const result = fieldTypeToDdbAttr[fieldType];
    if (!result) {
        throw new Error(`Unknown FieldType ${fieldType}`);
    }
    return result;
};
exports.getDdbAttrType = getDdbAttrType;
//# sourceMappingURL=cfn-template-utils.js.map