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
exports.run = void 0;
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const constants_1 = require("../../constants");
const run = async (context) => {
    var _a;
    const nameOverrides = {
        S3: 'S3 bucket - Content (Images, audio, video, etc.)',
        DynamoDB: 'DynamoDB table - NoSQL Database',
    };
    const servicesMetadata = (await Promise.resolve().then(() => __importStar(require('../../provider-utils/supported-services')))).supportedServices;
    const serviceSelection = await context.amplify.serviceSelectionPrompt(context, constants_1.categoryName, servicesMetadata, undefined, nameOverrides);
    const providerController = await (_a = `../../provider-utils/${serviceSelection.providerName}`, Promise.resolve().then(() => __importStar(require(_a))));
    if (!providerController) {
        amplify_prompts_1.printer.error('Provider not configured for this category');
        return undefined;
    }
    return providerController.importResource(context, constants_1.categoryName, serviceSelection);
};
exports.run = run;
//# sourceMappingURL=import.js.map