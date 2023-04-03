"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachPrevParamsToContext = void 0;
const getAuthResourceName_1 = require("../../../utils/getAuthResourceName");
const auth_input_state_1 = require("../auth-inputs-manager/auth-input-state");
const attachPrevParamsToContext = async (context) => {
    const resourceName = await (0, getAuthResourceName_1.getAuthResourceName)(context);
    const cliState = new auth_input_state_1.AuthInputState(context, resourceName);
    context.updatingAuth = await cliState.loadResourceParameters(context, cliState.getCLIInputPayload());
};
exports.attachPrevParamsToContext = attachPrevParamsToContext;
//# sourceMappingURL=attach-prev-params-to-context.js.map