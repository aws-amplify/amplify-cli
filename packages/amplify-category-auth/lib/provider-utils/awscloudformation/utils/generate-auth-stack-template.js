"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAuthStackTemplate = void 0;
const amplify_environment_parameters_1 = require("@aws-amplify/amplify-environment-parameters");
const auth_stack_transform_1 = require("../auth-stack-builder/auth-stack-transform");
const generateAuthStackTemplate = async (context, resourceName) => {
    await (0, amplify_environment_parameters_1.ensureEnvParamManager)();
    const authTransform = new auth_stack_transform_1.AmplifyAuthTransform(resourceName);
    return authTransform.transform(context);
};
exports.generateAuthStackTemplate = generateAuthStackTemplate;
//# sourceMappingURL=generate-auth-stack-template.js.map