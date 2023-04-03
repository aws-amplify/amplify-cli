"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthTriggerStackCfnParameters = void 0;
const auth_input_state_1 = require("../auth-inputs-manager/auth-input-state");
const configure_sms_1 = require("./configure-sms");
const getAuthTriggerStackCfnParameters = async (context, authResourceName) => {
    const authRootStackResourceName = `auth${authResourceName}`;
    const authTriggerRootStackParams = {
        userpoolId: {
            'Fn::GetAtt': [authRootStackResourceName, 'Outputs.UserPoolId'],
        },
        userpoolArn: {
            'Fn::GetAtt': [authRootStackResourceName, 'Outputs.UserPoolArn'],
        },
    };
    const authState = new auth_input_state_1.AuthInputState(context, authResourceName);
    if (authState.cliInputFileExists()) {
        const { cognitoConfig } = authState.getCLIInputPayload();
        const configureSMS = (0, configure_sms_1.configureSmsOption)(cognitoConfig);
        if (!cognitoConfig.useEnabledMfas || configureSMS) {
            authTriggerRootStackParams.snsRoleArn = {
                'Fn::GetAtt': [authRootStackResourceName, 'Outputs.CreatedSNSRole'],
            };
        }
    }
    return authTriggerRootStackParams;
};
exports.getAuthTriggerStackCfnParameters = getAuthTriggerStackCfnParameters;
//# sourceMappingURL=get-auth-trigger-stack-cfn-parameters.js.map