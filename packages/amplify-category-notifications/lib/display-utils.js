"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.viewShowInlineModeInstructionsFail = exports.viewShowInlineModeInstructionsStop = exports.viewShowInlineModeInstructionsStart = exports.viewShowDeferredModeInstructions = exports.viewShowAllChannelsEnabledWarning = void 0;
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const viewShowAllChannelsEnabledWarning = () => {
    amplify_prompts_1.printer.info('All the available notification channels have already been enabled.');
};
exports.viewShowAllChannelsEnabledWarning = viewShowAllChannelsEnabledWarning;
const viewShowDeferredModeInstructions = () => {
    amplify_prompts_1.printer.warn('Run "amplify push" to update the channel in the cloud');
};
exports.viewShowDeferredModeInstructions = viewShowDeferredModeInstructions;
const viewShowInlineModeInstructionsStart = async (channelName) => {
    amplify_prompts_1.printer.info(`Channel ${channelName} requires a Pinpoint resource in the cloud. Proceeding to deploy Auth and Pinpoint resources...`);
};
exports.viewShowInlineModeInstructionsStart = viewShowInlineModeInstructionsStart;
const viewShowInlineModeInstructionsStop = async (channelName) => {
    amplify_prompts_1.printer.success(`Channel ${channelName}: Auth and Pinpoint resources deployed successfully.`);
};
exports.viewShowInlineModeInstructionsStop = viewShowInlineModeInstructionsStop;
const viewShowInlineModeInstructionsFail = async (channelName, err) => {
    amplify_prompts_1.printer.error(`Channel ${channelName}: Auth and Pinpoint resources deployment failed with Error ${err}`);
};
exports.viewShowInlineModeInstructionsFail = viewShowInlineModeInstructionsFail;
//# sourceMappingURL=display-utils.js.map