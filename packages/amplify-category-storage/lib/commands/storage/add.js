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
exports.run = exports.name = void 0;
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const constants_1 = require("../../constants");
exports.name = 'add';
let options;
async function run(context) {
    const { amplify } = context;
    const serviceMetadata = (await Promise.resolve().then(() => __importStar(require('../../provider-utils/supported-services')))).supportedServices;
    return amplify
        .serviceSelectionPrompt(context, constants_1.categoryName, serviceMetadata)
        .then(async (result) => {
        var _a;
        options = {
            service: result.service,
            providerPlugin: result.providerName,
        };
        const providerController = await (_a = `../../provider-utils/${result.providerName}`, Promise.resolve().then(() => __importStar(require(_a))));
        if (!providerController) {
            amplify_prompts_1.printer.error('Provider not configured for this category');
            return undefined;
        }
        return providerController.addResource(context, constants_1.categoryName, result.service, options);
    })
        .then((resourceName) => {
        if (resourceName) {
            amplify_prompts_1.printer.success(`Successfully added resource ${resourceName} locally`);
            amplify_prompts_1.printer.info('');
            amplify_prompts_1.printer.warn('If a user is part of a user pool group, run "amplify update storage" to enable IAM group policies for CRUD operations');
            amplify_prompts_1.printer.success('Some next steps:');
            amplify_prompts_1.printer.info('"amplify push" builds all of your local backend resources and provisions them in the cloud');
            amplify_prompts_1.printer.info('"amplify publish" builds all of your local backend and front-end resources (if you added hosting category) and provisions them in the cloud');
            amplify_prompts_1.printer.info('');
        }
    })
        .catch(async (err) => {
        if (err.message) {
            amplify_prompts_1.printer.error(err.message);
        }
        amplify_prompts_1.printer.error('An error occurred when adding the storage resource');
        if (err.stack) {
            amplify_prompts_1.printer.info(err.stack);
        }
        await context.usageData.emitError(err);
        process.exitCode = 1;
    });
}
exports.run = run;
//# sourceMappingURL=add.js.map