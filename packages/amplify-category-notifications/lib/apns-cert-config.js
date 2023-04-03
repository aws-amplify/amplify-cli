"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const apns_cert_p12decoder_1 = require("./apns-cert-p12decoder");
const validate_filepath_1 = require("./validate-filepath");
const run = async (channelInput) => {
    if (channelInput) {
        return (0, apns_cert_p12decoder_1.run)(channelInput);
    }
    const p12FilePath = await amplify_prompts_1.prompter.input('The certificate file path (.p12): ', { validate: validate_filepath_1.validateFilePath });
    const p12FilePassword = await amplify_prompts_1.prompter.input('The certificate password (if any): ');
    const answers = {
        P12FilePath: p12FilePath,
        P12FilePassword: p12FilePassword,
    };
    return (0, apns_cert_p12decoder_1.run)(answers);
};
exports.run = run;
//# sourceMappingURL=apns-cert-config.js.map