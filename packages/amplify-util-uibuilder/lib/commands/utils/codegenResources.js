"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateBaseForms = exports.getAmplifyDataSchema = exports.generateAmplifyUiBuilderUtilFile = exports.generateAmplifyUiBuilderIndexFile = exports.createUiBuilderForm = exports.createUiBuilderTheme = exports.createUiBuilderComponent = void 0;
const codegen_ui_1 = require("@aws-amplify/codegen-ui");
const codegen_ui_react_1 = require("@aws-amplify/codegen-ui-react");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const getUiBuilderComponentsPath_1 = require("./getUiBuilderComponentsPath");
const config = {
    module: codegen_ui_react_1.ModuleKind.ES2020,
    target: codegen_ui_react_1.ScriptTarget.ES2020,
    script: codegen_ui_react_1.ScriptKind.JSX,
    renderTypeDeclarations: true,
};
const createUiBuilderComponent = (context, schema, dataSchema) => {
    const uiBuilderComponentsPath = (0, getUiBuilderComponentsPath_1.getUiBuilderComponentsPath)(context);
    const rendererFactory = new codegen_ui_1.StudioTemplateRendererFactory((component) => new codegen_ui_react_1.AmplifyRenderer(component, config, dataSchema));
    const outputPathDir = uiBuilderComponentsPath;
    const rendererManager = new codegen_ui_1.StudioTemplateRendererManager(rendererFactory, {
        outputPathDir,
    });
    rendererManager.renderSchemaToTemplate(schema);
    return schema;
};
exports.createUiBuilderComponent = createUiBuilderComponent;
const createUiBuilderTheme = (context, schema, options) => {
    const uiBuilderComponentsPath = (0, getUiBuilderComponentsPath_1.getUiBuilderComponentsPath)(context);
    const rendererFactory = new codegen_ui_1.StudioTemplateRendererFactory((component) => new codegen_ui_react_1.ReactThemeStudioTemplateRenderer(component, config, options));
    const outputPathDir = uiBuilderComponentsPath;
    const rendererManager = new codegen_ui_1.StudioTemplateRendererManager(rendererFactory, {
        outputPathDir,
    });
    try {
        rendererManager.renderSchemaToTemplate(schema);
        return schema;
    }
    catch (e) {
        amplify_prompts_1.printer.debug(e);
        amplify_prompts_1.printer.debug('Skipping invalid theme with schema');
        amplify_prompts_1.printer.debug(JSON.stringify(schema, null, 2));
        throw e;
    }
};
exports.createUiBuilderTheme = createUiBuilderTheme;
const createUiBuilderForm = (context, schema, dataSchema) => {
    const uiBuilderComponentsPath = (0, getUiBuilderComponentsPath_1.getUiBuilderComponentsPath)(context);
    const rendererFactory = new codegen_ui_1.StudioTemplateRendererFactory((form) => new codegen_ui_react_1.AmplifyFormRenderer(form, dataSchema, config));
    const outputPathDir = uiBuilderComponentsPath;
    const rendererManager = new codegen_ui_1.StudioTemplateRendererManager(rendererFactory, {
        outputPathDir,
    });
    try {
        rendererManager.renderSchemaToTemplate(schema);
        return schema;
    }
    catch (e) {
        amplify_prompts_1.printer.debug(e);
        amplify_prompts_1.printer.debug('Skipping invalid form with schema');
        amplify_prompts_1.printer.debug(JSON.stringify(schema, null, 2));
        throw e;
    }
};
exports.createUiBuilderForm = createUiBuilderForm;
const generateAmplifyUiBuilderIndexFile = (context, schemas) => {
    const uiBuilderComponentsPath = (0, getUiBuilderComponentsPath_1.getUiBuilderComponentsPath)(context);
    const rendererFactory = new codegen_ui_1.StudioTemplateRendererFactory((schema) => new codegen_ui_react_1.ReactIndexStudioTemplateRenderer(schema, config));
    const outputPathDir = uiBuilderComponentsPath;
    const rendererManager = new codegen_ui_1.StudioTemplateRendererManager(rendererFactory, {
        outputPathDir,
    });
    try {
        if (schemas.length) {
            rendererManager.renderSchemaToTemplate(schemas);
        }
    }
    catch (e) {
        amplify_prompts_1.printer.debug(e);
        amplify_prompts_1.printer.debug('Failed to generate component index file');
        throw e;
    }
};
exports.generateAmplifyUiBuilderIndexFile = generateAmplifyUiBuilderIndexFile;
const generateAmplifyUiBuilderUtilFile = (context, { hasForms, hasViews }) => {
    const uiBuilderComponentsPath = (0, getUiBuilderComponentsPath_1.getUiBuilderComponentsPath)(context);
    const rendererFactory = new codegen_ui_1.StudioTemplateRendererFactory((utils) => new codegen_ui_react_1.ReactUtilsStudioTemplateRenderer(utils, config));
    const outputPathDir = uiBuilderComponentsPath;
    const rendererManager = new codegen_ui_1.StudioTemplateRendererManager(rendererFactory, {
        outputPathDir,
    });
    const utils = new Set();
    if (hasForms) {
        utils.add('validation');
        utils.add('formatter');
        utils.add('fetchByPath');
    }
    if (hasViews) {
        utils.add('formatter');
    }
    try {
        if (utils.size) {
            rendererManager.renderSchemaToTemplate([...utils]);
        }
    }
    catch (e) {
        amplify_prompts_1.printer.debug(e);
        amplify_prompts_1.printer.debug('Failed to generate component index file');
        throw e;
    }
};
exports.generateAmplifyUiBuilderUtilFile = generateAmplifyUiBuilderUtilFile;
const getAmplifyDataSchema = async (context) => {
    try {
        const localSchema = await context.amplify.invokePluginMethod(context, 'codegen', undefined, 'getModelIntrospection', [context]);
        if (!localSchema) {
            amplify_prompts_1.printer.debug('Local schema not found');
            return undefined;
        }
        return (0, codegen_ui_1.getGenericFromDataStore)(localSchema);
    }
    catch (e) {
        amplify_prompts_1.printer.debug(e.toString());
        return undefined;
    }
};
exports.getAmplifyDataSchema = getAmplifyDataSchema;
const generateBaseForms = (modelMap) => {
    const getSchema = (name, type) => ({
        name: `${name}${type === 'create' ? 'CreateForm' : 'UpdateForm'}`,
        formActionType: type,
        dataType: { dataSourceType: 'DataStore', dataTypeName: name },
        fields: {},
        sectionalElements: {},
        style: {},
        cta: {},
    });
    const schemas = [];
    Object.entries(modelMap).forEach(([name, set]) => {
        set.forEach((type) => schemas.push(getSchema(name, type)));
    });
    return schemas;
};
exports.generateBaseForms = generateBaseForms;
//# sourceMappingURL=codegenResources.js.map