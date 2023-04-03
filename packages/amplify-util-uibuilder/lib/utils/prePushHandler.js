"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prePushHandler = void 0;
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const clients_1 = require("../clients");
const utils_1 = require("../commands/utils");
const prePushHandler = async (context) => {
    if (!(await (0, utils_1.shouldRenderComponents)(context))) {
        return;
    }
    const studioClient = await clients_1.AmplifyStudioClient.setClientInfo(context);
    const [formSchemas, localSchema] = await Promise.all([studioClient.listForms(), context.amplify.invokePluginMethod(context, 'codegen', undefined, 'getModelIntrospection', [context])]);
    if (!localSchema) {
        amplify_prompts_1.printer.debug('Local schema not found');
        return;
    }
    printDetachedFormsWarning(formSchemas, localSchema);
};
exports.prePushHandler = prePushHandler;
const printDetachedFormsWarning = (formSchemas, localSchema) => {
    const modelNames = new Set(Object.keys(localSchema.models));
    const detachedCustomForms = [];
    formSchemas.entities.forEach((form) => {
        if ((0, utils_1.isFormDetachedFromModel)(form, modelNames) && (0, utils_1.isFormSchemaCustomized)(form)) {
            detachedCustomForms.push(form.name);
        }
    });
    if (detachedCustomForms.length > 0) {
        amplify_prompts_1.printer.warn(`The following form${detachedCustomForms.length === 1 ? '' : 's'} will no longer be available because the connected data model no longer exists: ${detachedCustomForms.join(', ')}`);
    }
};
//# sourceMappingURL=prePushHandler.js.map