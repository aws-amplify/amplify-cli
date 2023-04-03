"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUiBuilderForms = exports.generateUiBuilderThemes = exports.generateUiBuilderComponents = void 0;
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const codegen_ui_1 = require("@aws-amplify/codegen-ui");
const codegenResources_1 = require("./codegenResources");
const getUiBuilderComponentsPath_1 = require("./getUiBuilderComponentsPath");
const generateUiBuilderComponents = (context, componentSchemas, dataSchema) => {
    const componentResults = componentSchemas.map((schema) => {
        try {
            const component = (0, codegenResources_1.createUiBuilderComponent)(context, schema, dataSchema);
            return { resultType: 'SUCCESS', schema: component };
        }
        catch (e) {
            amplify_prompts_1.printer.debug(`Failure caught processing ${schema.name}`);
            amplify_prompts_1.printer.debug(e);
            return { resultType: 'FAILURE', schemaName: schema.name, error: e };
        }
    });
    amplify_prompts_1.printer.debug(`Generated ${componentResults.filter((result) => result.resultType === 'SUCCESS').length} components in ${(0, getUiBuilderComponentsPath_1.getUiBuilderComponentsPath)(context)}`);
    return componentResults;
};
exports.generateUiBuilderComponents = generateUiBuilderComponents;
const generateUiBuilderThemes = (context, themeSchemas) => {
    if (themeSchemas.length === 0) {
        return [generateDefaultTheme(context)];
    }
    const themeResults = themeSchemas.map((schema) => {
        try {
            const theme = (0, codegenResources_1.createUiBuilderTheme)(context, schema);
            return { resultType: 'SUCCESS', schema: theme };
        }
        catch (e) {
            amplify_prompts_1.printer.debug(`Failure caught processing ${schema.name}`);
            amplify_prompts_1.printer.debug(e);
            return { resultType: 'FAILURE', schemaName: schema.name, error: e };
        }
    });
    amplify_prompts_1.printer.debug(`Generated ${themeResults.filter((result) => result.resultType === 'SUCCESS').length} themes in ${(0, getUiBuilderComponentsPath_1.getUiBuilderComponentsPath)(context)}`);
    return themeResults;
};
exports.generateUiBuilderThemes = generateUiBuilderThemes;
const generateDefaultTheme = (context) => {
    try {
        const theme = (0, codegenResources_1.createUiBuilderTheme)(context, { name: 'studioTheme', values: [] }, { renderDefaultTheme: true });
        amplify_prompts_1.printer.debug(`Generated default theme in ${(0, getUiBuilderComponentsPath_1.getUiBuilderComponentsPath)(context)}`);
        return { resultType: 'SUCCESS', schema: theme };
    }
    catch (e) {
        amplify_prompts_1.printer.debug(`Failure caught rendering default theme`);
        amplify_prompts_1.printer.debug(e);
        return { resultType: 'FAILURE', schemaName: 'studioTheme', error: e };
    }
};
const generateUiBuilderForms = (context, formSchemas, dataSchema, autoGenerateForms) => {
    const modelMap = {};
    if ((dataSchema === null || dataSchema === void 0 ? void 0 : dataSchema.dataSourceType) === 'DataStore' && autoGenerateForms) {
        Object.entries(dataSchema.models).forEach(([name, model]) => {
            if ((0, codegen_ui_1.checkIsSupportedAsForm)(model) && !model.isJoinTable) {
                modelMap[name] = new Set(['create', 'update']);
            }
        });
    }
    const codegenForm = (schema) => {
        try {
            const form = (0, codegenResources_1.createUiBuilderForm)(context, schema, dataSchema);
            return { resultType: 'SUCCESS', schema: form };
        }
        catch (e) {
            amplify_prompts_1.printer.debug(`Failure caught processing ${schema.name}`);
            amplify_prompts_1.printer.debug(e);
            return {
                resultType: 'FAILURE',
                schemaName: schema.name,
                schema,
                error: e,
            };
        }
    };
    const formResults = formSchemas.map((schema) => {
        var _a, _b;
        if ((schema === null || schema === void 0 ? void 0 : schema.dataType) && ((_a = schema.dataType) === null || _a === void 0 ? void 0 : _a.dataSourceType) === 'DataStore') {
            (_b = modelMap[schema.dataType.dataTypeName]) === null || _b === void 0 ? void 0 : _b.delete(schema.formActionType);
        }
        return codegenForm(schema);
    });
    formResults.push(...(0, codegenResources_1.generateBaseForms)(modelMap).map(codegenForm));
    amplify_prompts_1.printer.debug(`Generated ${formResults.filter((result) => result.resultType === 'SUCCESS').length} forms in ${(0, getUiBuilderComponentsPath_1.getUiBuilderComponentsPath)(context)}`);
    return formResults;
};
exports.generateUiBuilderForms = generateUiBuilderForms;
//# sourceMappingURL=syncAmplifyUiBuilderComponents.js.map