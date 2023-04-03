"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUserPoolGroupStackTemplate = void 0;
const user_pool_group_stack_transform_1 = require("../auth-stack-builder/user-pool-group-stack-transform");
const generateUserPoolGroupStackTemplate = async (context, resourceName) => {
    try {
        const userPoolTransform = new user_pool_group_stack_transform_1.AmplifyUserPoolGroupTransform(resourceName);
        return await userPoolTransform.transform(context);
    }
    catch (e) {
        throw new Error(e);
    }
};
exports.generateUserPoolGroupStackTemplate = generateUserPoolGroupStackTemplate;
//# sourceMappingURL=generate-user-pool-group-stack-template.js.map