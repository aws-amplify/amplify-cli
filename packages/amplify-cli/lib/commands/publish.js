"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const push_1 = require("./push");
const run = async (context) => {
    var _a, _b;
    context.amplify.constructExeInfo(context);
    const { amplifyMeta } = context.exeInfo;
    const isHostingAdded = amplifyMeta.hosting && Object.keys(amplifyMeta.hosting).length > 0;
    if (!isHostingAdded) {
        amplify_prompts_1.printer.blankLine();
        amplify_prompts_1.printer.error('Add hosting to your project before publishing your project');
        amplify_prompts_1.printer.info('Command: amplify hosting add');
        amplify_prompts_1.printer.blankLine();
        return;
    }
    let isHostingAlreadyPushed = false;
    Object.keys(amplifyMeta.hosting).every((hostingService) => {
        let continueToCheckNext = true;
        if (amplifyMeta.hosting[hostingService].lastPushTimeStamp) {
            const lastPushTime = new Date(amplifyMeta.hosting[hostingService].lastPushTimeStamp).getTime();
            if (lastPushTime < Date.now()) {
                isHostingAlreadyPushed = true;
                continueToCheckNext = false;
            }
        }
        return continueToCheckNext;
    });
    const didPush = await (0, push_1.run)(context);
    let continueToPublish = didPush || !!((_b = (_a = context === null || context === void 0 ? void 0 : context.exeInfo) === null || _a === void 0 ? void 0 : _a.inputParams) === null || _b === void 0 ? void 0 : _b.yes);
    if (!continueToPublish && isHostingAlreadyPushed) {
        amplify_prompts_1.printer.info('');
        continueToPublish = await context.amplify.confirmPrompt('Do you still want to publish the frontend?');
    }
    if (continueToPublish) {
        const frontendPlugins = context.amplify.getFrontendPlugins(context);
        const frontendHandlerModule = require(frontendPlugins[context.exeInfo.projectConfig.frontend]);
        await frontendHandlerModule.publish(context);
    }
};
exports.run = run;
//# sourceMappingURL=publish.js.map