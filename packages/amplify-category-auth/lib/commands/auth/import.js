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
const project_has_auth_1 = require("../../provider-utils/awscloudformation/utils/project-has-auth");
const supported_services_1 = require("../../provider-utils/supported-services");
const path = __importStar(require("path"));
const print_auth_exists_warning_1 = require("../../provider-utils/awscloudformation/utils/print-auth-exists-warning");
const category = 'auth';
const run = async (context) => {
    var _a;
    if ((0, project_has_auth_1.projectHasAuth)()) {
        (0, print_auth_exists_warning_1.printAuthExistsWarning)(context);
        return undefined;
    }
    const servicesMetadata = (0, supported_services_1.getSupportedServices)();
    const serviceSelection = await context.amplify.serviceSelectionPrompt(context, category, servicesMetadata);
    const providerController = await (_a = path.join('..', '..', 'provider-utils', serviceSelection.providerName), Promise.resolve().then(() => __importStar(require(_a))));
    return providerController.importResource(context, serviceSelection);
};
exports.run = run;
//# sourceMappingURL=import.js.map