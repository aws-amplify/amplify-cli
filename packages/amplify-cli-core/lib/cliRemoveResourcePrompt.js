"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promptConfirmationRemove = void 0;
async function promptConfirmationRemove(context, serviceType) {
    var _a;
    let promptText = 'Are you sure you want to delete the resource? This action deletes all files related to this resource from the backend directory.';
    if (serviceType === 'imported') {
        promptText =
            'Are you sure you want to unlink this imported resource from this Amplify backend environment? The imported resource itself will not be deleted.';
    }
    const confirm = ((_a = context.input.options) === null || _a === void 0 ? void 0 : _a.yes) || (await context.amplify.confirmPrompt(promptText));
    return confirm;
}
exports.promptConfirmationRemove = promptConfirmationRemove;
//# sourceMappingURL=cliRemoveResourcePrompt.js.map