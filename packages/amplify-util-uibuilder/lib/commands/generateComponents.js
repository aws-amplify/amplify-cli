"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const ora_1 = __importDefault(require("ora"));
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const clients_1 = require("../clients");
const utils_1 = require("./utils");
const run = async (context, eventType) => {
    if (!(await (0, utils_1.shouldRenderComponents)(context))) {
        return;
    }
    const spinner = (0, ora_1.default)('');
    try {
        const studioClient = await clients_1.AmplifyStudioClient.setClientInfo(context);
        const [componentSchemas, themeSchemas, formSchemas, dataSchema] = await Promise.all([
            studioClient.listComponents(),
            studioClient.listThemes(),
            studioClient.listForms(),
            studioClient.isGraphQLSupported ? (0, utils_1.getAmplifyDataSchema)(context) : Promise.resolve(undefined),
        ]);
        const nothingWouldAutogenerate = !dataSchema || !studioClient.metadata.autoGenerateForms || !studioClient.isGraphQLSupported;
        if (nothingWouldAutogenerate && [componentSchemas, themeSchemas, formSchemas].every((group) => !group.entities.length)) {
            amplify_prompts_1.printer.debug('Skipping UI component generation since none are found.');
            return;
        }
        spinner.start('Generating UI components...');
        const generatedResults = {
            component: (0, utils_1.generateUiBuilderComponents)(context, componentSchemas.entities, dataSchema),
            theme: (0, utils_1.generateUiBuilderThemes)(context, themeSchemas.entities),
            form: (0, utils_1.generateUiBuilderForms)(context, formSchemas.entities, dataSchema, studioClient.metadata.autoGenerateForms && studioClient.isGraphQLSupported),
        };
        const successfulSchemas = [];
        const detachedForms = [];
        let hasSuccessfulForm = false;
        const failedResponseNames = [];
        const modelNames = (dataSchema === null || dataSchema === void 0 ? void 0 : dataSchema.models) ? new Set(Object.keys(dataSchema.models)) : new Set();
        Object.entries(generatedResults).forEach(([key, results]) => {
            results.forEach((result) => {
                if (result.resultType === 'SUCCESS') {
                    successfulSchemas.push(result.schema);
                    if (key === 'form') {
                        hasSuccessfulForm = true;
                    }
                }
                else {
                    const failedSchema = result.schema;
                    if ((0, utils_1.isStudioForm)(failedSchema) &&
                        failedSchema.id &&
                        dataSchema &&
                        eventType === 'PostPush' &&
                        (0, utils_1.isFormDetachedFromModel)(failedSchema, modelNames)) {
                        detachedForms.push({ id: failedSchema.id, name: failedSchema.name });
                        return;
                    }
                    failedResponseNames.push(result.schemaName);
                }
            });
        });
        (0, utils_1.generateAmplifyUiBuilderIndexFile)(context, successfulSchemas);
        (0, utils_1.generateAmplifyUiBuilderUtilFile)(context, { hasForms: hasSuccessfulForm, hasViews: false });
        if (failedResponseNames.length > 0) {
            spinner.fail(`Failed to sync the following components: ${failedResponseNames.join(', ')}`);
        }
        else {
            spinner.succeed('Synced UI components.');
        }
        const invalidComponentNames = [
            ...componentSchemas.entities.filter((component) => !component.schemaVersion).map((component) => component.name),
            ...formSchemas.entities.filter((form) => !form.schemaVersion).map((form) => form.name),
        ];
        if (invalidComponentNames.length) {
            amplify_prompts_1.printer.warn(`The components ${invalidComponentNames.join(', ')} were synced with an older version of Amplify Studio. Please re-sync your components with Figma to get latest features and changes.`);
        }
        (0, utils_1.notifyMissingPackages)(context);
        await (0, utils_1.deleteDetachedForms)(detachedForms, studioClient);
    }
    catch (e) {
        amplify_prompts_1.printer.debug(e);
        spinner.fail('Failed to sync UI components');
    }
};
exports.run = run;
//# sourceMappingURL=generateComponents.js.map