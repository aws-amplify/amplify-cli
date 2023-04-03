"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureHeadlessParameters = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const ensureHeadlessParameters = (resourceParameters, headlessParams) => {
    const missingParams = [];
    if (!headlessParams.userPoolId) {
        missingParams.push('userPoolId');
    }
    if (!headlessParams.webClientId) {
        missingParams.push('webClientId');
    }
    if (!headlessParams.nativeClientId) {
        missingParams.push('nativeClientId');
    }
    if (resourceParameters.authSelections === 'identityPoolAndUserPool' && !headlessParams.identityPoolId) {
        missingParams.push('identityPoolId');
    }
    if (missingParams.length > 0) {
        throw new amplify_cli_core_1.AmplifyError('InputValidationError', {
            message: `auth headless is missing the following inputParameters ${missingParams.join(', ')}`,
            link: 'https://docs.amplify.aws/cli/usage/headless/#--categories',
        });
    }
    const envSpecificParameters = {
        userPoolId: headlessParams.userPoolId,
        userPoolName: '',
        webClientId: headlessParams.webClientId,
        nativeClientId: headlessParams.nativeClientId,
    };
    if (resourceParameters.authSelections === 'identityPoolAndUserPool') {
        envSpecificParameters.identityPoolId = headlessParams.identityPoolId;
    }
    return envSpecificParameters;
};
exports.ensureHeadlessParameters = ensureHeadlessParameters;
//# sourceMappingURL=ensure-headless-parameters.js.map