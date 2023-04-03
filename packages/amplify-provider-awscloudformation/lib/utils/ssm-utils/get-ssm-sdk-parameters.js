"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSsmSdkParametersGetParametersByPath = exports.getSsmSdkParametersDeleteParameters = void 0;
const getSsmSdkParametersDeleteParameters = (keys) => {
    const sdkParameters = {
        Names: keys,
    };
    return sdkParameters;
};
exports.getSsmSdkParametersDeleteParameters = getSsmSdkParametersDeleteParameters;
const getSsmSdkParametersGetParametersByPath = (appId, envName, nextToken) => {
    const sdkParameters = {
        Path: `/amplify/${appId}/${envName}/`,
    };
    if (nextToken) {
        sdkParameters.NextToken = nextToken;
    }
    return sdkParameters;
};
exports.getSsmSdkParametersGetParametersByPath = getSsmSdkParametersGetParametersByPath;
//# sourceMappingURL=get-ssm-sdk-parameters.js.map