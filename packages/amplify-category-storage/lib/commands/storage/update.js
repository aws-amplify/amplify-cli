"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.alias = exports.name = void 0;
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const constants_1 = require("../../constants");
exports.name = 'update';
exports.alias = ['configure'];
async function run(context) {
    const { amplify } = context;
    const serviceMetadata = (await Promise.resolve().then(() => __importStar(require('../../provider-utils/supported-services')))).supportedServices;
    return amplify
        .serviceSelectionPrompt(context, constants_1.categoryName, serviceMetadata)
        .then(async (result) => {
        var _a;
        const providerController = await (_a = `../../provider-utils/${result.providerName}`, Promise.resolve().then(() => __importStar(require(_a))));
        if (!providerController) {
            amplify_prompts_1.printer.error('Provider not configured for this category');
            return undefined;
        }
        return providerController.updateResource(context, constants_1.categoryName, result.service);
    })
        .then((result) => {
        if (result) {
            amplify_prompts_1.printer.success('Successfully updated resource');
        }
    })
        .catch(async (err) => {
        if (err.stack) {
            amplify_prompts_1.printer.info(err.stack);
        }
        amplify_prompts_1.printer.error('An error occurred when updating the storage resource');
        await context.usageData.emitError(err);
        process.exitCode = 1;
    });
}
exports.run = run;
//# sourceMappingURL=update.js.map