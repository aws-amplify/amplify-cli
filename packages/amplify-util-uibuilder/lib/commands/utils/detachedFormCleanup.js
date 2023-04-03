"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDetachedForms = exports.isStudioForm = exports.isFormSchemaCustomized = exports.isFormDetachedFromModel = void 0;
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const tiny_async_pool_1 = __importDefault(require("tiny-async-pool"));
const isFormDetachedFromModel = (formSchema, modelNames) => {
    return formSchema.dataType.dataSourceType === 'DataStore' && !modelNames.has(formSchema.dataType.dataTypeName);
};
exports.isFormDetachedFromModel = isFormDetachedFromModel;
const isFormSchemaCustomized = (formSchema) => {
    const { fields, style, sectionalElements } = formSchema;
    if (!isEmpty({ ...fields, ...sectionalElements })) {
        return true;
    }
    return Object.values(style).some((styleConfig) => styleConfig !== undefined);
};
exports.isFormSchemaCustomized = isFormSchemaCustomized;
const isStudioForm = (schema) => {
    if (!schema)
        return false;
    return 'formActionType' in schema;
};
exports.isStudioForm = isStudioForm;
const deleteDetachedForms = async (detachedForms, studioClient) => {
    const deleteForm = async ({ id, name }) => {
        try {
            await studioClient.deleteForm(id);
            return { status: 'SUCCESS', message: `Deleted detached form ${name}` };
        }
        catch (error) {
            return { status: 'FAIL', message: `Failed to delete detached form ${name}` };
        }
    };
    for await (const status of (0, tiny_async_pool_1.default)(5, detachedForms, deleteForm)) {
        amplify_prompts_1.printer.debug(status.message);
    }
};
exports.deleteDetachedForms = deleteDetachedForms;
const isEmpty = (obj) => Object.keys(obj).length === 0;
//# sourceMappingURL=detachedFormCleanup.js.map