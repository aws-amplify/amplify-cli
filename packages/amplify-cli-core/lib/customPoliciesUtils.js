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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCustomPoliciesInTemplate = exports.createDefaultCustomPoliciesFile = exports.CustomIAMPoliciesSchema = void 0;
const cloudform_types_1 = require("cloudform-types");
const state_manager_1 = require("./state-manager");
const ajv_1 = __importDefault(require("ajv"));
const _ = __importStar(require("lodash"));
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const jsonUtilities_1 = require("./jsonUtilities");
const errors_1 = require("./errors");
exports.CustomIAMPoliciesSchema = {
    type: 'array',
    minItems: 1,
    items: {
        type: 'object',
        properties: {
            Action: { type: 'array', items: { type: 'string' }, minItems: 1, nullable: false },
            Resource: {
                type: 'array',
                anyOf: [{ contains: { type: 'string' } }, { contains: { type: 'object', additionalProperties: true } }],
                minItems: 1,
                nullable: false,
            },
        },
        optionalProperties: {
            Effect: { type: 'string', enum: ['Allow', 'Deny'], default: 'Allow' },
        },
        required: ['Resource', 'Action'],
        additionalProperties: true,
    },
    additionalProperties: false,
};
function createDefaultCustomPoliciesFile(categoryName, resourceName) {
    const customPoliciesPath = state_manager_1.pathManager.getCustomPoliciesPath(categoryName, resourceName);
    const defaultCustomPolicies = [
        {
            Action: [],
            Resource: [],
        },
    ];
    jsonUtilities_1.JSONUtilities.writeJson(customPoliciesPath, defaultCustomPolicies);
}
exports.createDefaultCustomPoliciesFile = createDefaultCustomPoliciesFile;
function generateCustomPoliciesInTemplate(template, resourceName, service, category) {
    if ((category === 'api' && service === 'ElasticContainer') || (category === 'function' && service === 'Lambda')) {
        const customPolicies = state_manager_1.stateManager.getCustomPolicies(category, resourceName);
        if (!resourceHasCustomPolicies(customPolicies)) {
            if (template.Resources && template.Resources.CustomLambdaExecutionPolicy) {
                delete template.Resources.CustomLambdaExecutionPolicy;
            }
            if (template.Resources && template.Resources.CustomExecutionPolicyForContainer) {
                delete template.Resources.CustomExecutionPolicyForContainer;
            }
            return template;
        }
        validateCustomPolicies(customPolicies, category, resourceName);
        return addCustomPoliciesToCFNTemplate(service, category, customPolicies, template, resourceName);
    }
    return template;
}
exports.generateCustomPoliciesInTemplate = generateCustomPoliciesInTemplate;
function addCustomPoliciesToCFNTemplate(service, category, customPolicies, cfnTemplate, resourceName) {
    warnWildcardCustomPoliciesResource(customPolicies, resourceName);
    const generatedCustomPolicies = generateCustomPolicyStatements(customPolicies);
    if (category === 'function' && service === 'Lambda') {
        return applyCustomPolicyToLambda(generatedCustomPolicies, cfnTemplate);
    }
    if (category === 'api' && service === 'ElasticContainer') {
        return applyCustomPolicyToElasticContainers(generatedCustomPolicies, cfnTemplate);
    }
    return cfnTemplate;
}
function generateCustomPolicyStatements(customPolicies) {
    return customPolicies.map((policyStatement) => ({
        ...replaceEnvWithRef(policyStatement),
        Effect: policyStatement.Effect || 'Allow',
    }));
}
function replaceEnvWithRef(policy) {
    const resource = policy.Resource.map((resource) => typeof resource === 'string' && resource.includes('${env}') ? cloudform_types_1.Fn.Sub(resource, { env: cloudform_types_1.Fn.Ref('env') }) : resource);
    policy.Resource = resource;
    return policy;
}
function validateCustomPolicies(data, categoryName, resourceName) {
    const ajv = new ajv_1.default();
    const validatePolicy = ajv.compile(exports.CustomIAMPoliciesSchema);
    const valid = validatePolicy(data);
    if (!valid) {
        amplify_prompts_1.printer.error(`${resourceName} ${categoryName} custom-policies.json failed validation:`);
        amplify_prompts_1.formatter.list(((validatePolicy === null || validatePolicy === void 0 ? void 0 : validatePolicy.errors) || []).map((err) => `${err.dataPath} ${err.message}`));
        throw new errors_1.CustomPoliciesFormatError(`
      Invalid custom IAM policies for ${resourceName} ${categoryName}.
      See details above and fix errors in <project-dir>/amplify/backend/${categoryName}/${resourceName}/custom-policies.json.
      Learn more about custom IAM policies: https://docs.amplify.aws/cli/function/#access-existing-aws-resource-from-lambda-function
    `);
    }
    for (const customPolicy of data) {
        const resources = customPolicy.Resource;
        const actions = customPolicy.Action;
        const resourceRegex = new RegExp('arn:(aws[a-zA-Z0-9-]*):([a-zA-Z0-9\\-])+:(([a-z]{2}|\\*)(-gov)?-[a-z-*]+-(\\d{1}|\\*)|\\*)?:(\\d{12}|\\*)?:(.*)');
        const actionRegex = new RegExp('[a-zA-Z0-9]+:[a-z|A-Z|0-9|*]+');
        const wrongResourcesRegex = [];
        const wrongActionsRegex = [];
        let errorMessage = '';
        for (const resource of resources) {
            if (typeof resource !== 'string') {
                continue;
            }
            if (!(resourceRegex.test(resource) || resource === '*')) {
                wrongResourcesRegex.push(resource);
            }
        }
        for (const action of actions) {
            if (!actionRegex.test(action)) {
                wrongActionsRegex.push(action);
            }
        }
        const customPoliciesPath = state_manager_1.pathManager.getCustomPoliciesPath(categoryName, resourceName);
        if (wrongResourcesRegex.length > 0) {
            errorMessage += `Invalid custom IAM policy for ${resourceName}. Incorrect "Resource": ${wrongResourcesRegex.toString()}\n Edit ${customPoliciesPath} to fix`;
        }
        if (wrongActionsRegex.length > 0) {
            errorMessage += `Invalid custom IAM policy for ${resourceName}. Incorrect "Action": ${wrongActionsRegex.toString()}\n Edit ${customPoliciesPath} to fix`;
        }
        if (errorMessage.length > 0) {
            throw new errors_1.CustomPoliciesFormatError(errorMessage);
        }
    }
}
function resourceHasCustomPolicies(customPolicies) {
    var _a;
    const customPolicy = _.first(customPolicies);
    if (!customPolicy || (customPolicy && ((_a = customPolicy.Action) === null || _a === void 0 ? void 0 : _a.length) === 0 && customPolicy.Resource.length == 0)) {
        return false;
    }
    return true;
}
function warnWildcardCustomPoliciesResource(customPolicies, resourceName) {
    customPolicies
        .filter((policy) => policy.Resource.includes('*'))
        .forEach((policy) => amplify_prompts_1.printer.warn(`Warning: You've specified "*" as the "Resource" in ${resourceName}'s custom IAM policy.\n This will grant ${resourceName} the ability to perform ${policy.Action} on ALL resources in this AWS Account.`));
}
function applyCustomPolicyToLambda(generatedCustomPolicies, cfnTemplate) {
    const policy = new cloudform_types_1.IAM.Policy({
        PolicyName: 'custom-lambda-execution-policy',
        PolicyDocument: {
            Version: '2012-10-17',
            Statement: generatedCustomPolicies,
        },
        Roles: [cloudform_types_1.Fn.Ref('LambdaExecutionRole')],
    });
    policy.dependsOn('LambdaExecutionRole');
    _.setWith(cfnTemplate, ['Resources', 'CustomLambdaExecutionPolicy'], policy);
    return cfnTemplate;
}
function applyCustomPolicyToElasticContainers(generatedCustomPolicies, cfnTemplate) {
    const taskRoleArn = _.get(cfnTemplate, ['Resources', 'TaskDefinition', 'Properties', 'TaskRoleArn', 'Fn::GetAtt']);
    if (!taskRoleArn) {
        amplify_prompts_1.printer.warn('Cannot apply custom policies could not find Task Role');
        return cfnTemplate;
    }
    const policy = new cloudform_types_1.IAM.Policy({
        PolicyDocument: {
            Statement: generatedCustomPolicies,
            Version: '2012-10-17',
        },
        PolicyName: 'CustomExecutionPolicyForContainer',
        Roles: [cloudform_types_1.Fn.Ref(taskRoleArn[0])],
    });
    _.setWith(cfnTemplate, ['Resources', 'CustomExecutionPolicyForContainer'], policy);
    return cfnTemplate;
}
//# sourceMappingURL=customPoliciesUtils.js.map