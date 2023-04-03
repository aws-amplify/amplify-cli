"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const validate_filepath_1 = require("./validate-filepath");
const apns_cert_p8decoder_1 = require("./apns-cert-p8decoder");
const run = async (channelInput) => {
    let keyConfig;
    if (channelInput) {
        keyConfig = channelInput;
    }
    else {
        const bundleId = await amplify_prompts_1.prompter.input('The bundle id used for APNs Tokens: ');
        const teamId = await amplify_prompts_1.prompter.input('The team id used for APNs Tokens: ');
        const tokenKeyId = await amplify_prompts_1.prompter.input('The key id used for APNs Tokens: ');
        const p8FilePath = await amplify_prompts_1.prompter.input('The key file path (.p8): ', { validate: validate_filepath_1.validateFilePath });
        keyConfig = {
            BundleId: bundleId,
            TeamId: teamId,
            TokenKeyId: tokenKeyId,
            P8FilePath: p8FilePath,
        };
    }
    keyConfig.TokenKey = (0, apns_cert_p8decoder_1.run)(keyConfig.P8FilePath);
    delete keyConfig.P8FilePath;
    return keyConfig;
};
exports.run = run;
//# sourceMappingURL=apns-key-config.js.map