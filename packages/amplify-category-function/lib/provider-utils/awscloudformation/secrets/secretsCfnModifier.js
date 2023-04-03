"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSecretsInCfnTemplate = void 0;
const cloudform_types_1 = require("cloudform-types");
const policy_1 = __importDefault(require("cloudform-types/types/iam/policy"));
const lodash_1 = __importDefault(require("lodash"));
const secretDeltaUtilities_1 = require("./secretDeltaUtilities");
const secretName_1 = require("./secretName");
const updateSecretsInCfnTemplate = async (cfnTemplate, secretDeltas, functionName) => {
    var _a, _b, _c;
    const lambdaCfn = (_a = cfnTemplate === null || cfnTemplate === void 0 ? void 0 : cfnTemplate.Resources) === null || _a === void 0 ? void 0 : _a.LambdaFunction;
    if (!lambdaCfn) {
        throw new Error('CFN template does not have a resource with logical ID "LambdaFunction"');
    }
    let envVarsCfn = (_c = (_b = lambdaCfn === null || lambdaCfn === void 0 ? void 0 : lambdaCfn.Properties) === null || _b === void 0 ? void 0 : _b.Environment) === null || _c === void 0 ? void 0 : _c.Variables;
    if (!envVarsCfn) {
        lodash_1.default.setWith(lambdaCfn, ['Properties', 'Environment', 'Variables'], {});
        envVarsCfn = lambdaCfn.Properties.Environment.Variables;
    }
    Object.entries(secretDeltas).forEach(([secretName, secretDelta]) => {
        switch (secretDelta.operation) {
            case 'remove':
                delete envVarsCfn[secretName];
                break;
            case 'set':
            case 'retain':
                envVarsCfn[secretName] = (0, secretName_1.getFunctionSecretCfnName)(secretName, functionName);
                break;
        }
    });
    const hasSecrets = (0, secretDeltaUtilities_1.hasExistingSecrets)(secretDeltas);
    if (hasSecrets) {
        cfnTemplate.Resources.AmplifyFunctionSecretsPolicy = getFunctionSecretsPolicy(functionName);
    }
    else {
        cfnTemplate.Resources.AmplifyFunctionSecretsPolicy = undefined;
    }
    if (hasSecrets) {
        cfnTemplate.Parameters[secretName_1.secretsPathAmplifyAppIdKey] = {
            Type: 'String',
        };
    }
    else {
        cfnTemplate.Parameters[secretName_1.secretsPathAmplifyAppIdKey] = undefined;
    }
    return cfnTemplate;
};
exports.updateSecretsInCfnTemplate = updateSecretsInCfnTemplate;
const getFunctionSecretsPolicy = (functionName) => {
    const policy = new policy_1.default({
        PolicyName: 'amplify-function-secrets-policy',
        Roles: [
            cloudform_types_1.Fn.Ref('LambdaExecutionRole'),
        ],
        PolicyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Effect: 'Allow',
                    Action: ['ssm:GetParameter', 'ssm:GetParameters'],
                    Resource: cloudform_types_1.Fn.Join('', [
                        'arn:aws:ssm:',
                        cloudform_types_1.Fn.Ref('AWS::Region'),
                        ':',
                        cloudform_types_1.Fn.Ref('AWS::AccountId'),
                        ':parameter',
                        (0, secretName_1.getFunctionSecretCfnPrefix)(functionName),
                        '*',
                    ]),
                },
            ],
        },
    });
    policy.DependsOn = ['LambdaExecutionRole'];
    return policy;
};
//# sourceMappingURL=secretsCfnModifier.js.map