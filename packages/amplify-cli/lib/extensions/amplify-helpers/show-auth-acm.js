"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showACM = void 0;
const graphql_auth_transformer_1 = require("@aws-amplify/graphql-auth-transformer");
const graphql_1 = require("graphql");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const graphql_transformer_core_1 = require("@aws-amplify/graphql-transformer-core");
const amplify_cli_core_1 = require("amplify-cli-core");
function showACM(sdl, nodeName) {
    var _a, _b;
    const schema = (0, graphql_1.parse)(sdl);
    const type = schema.definitions.find((node) => { var _a; return node.kind === 'ObjectTypeDefinition' && node.name.value === nodeName && ((_a = node === null || node === void 0 ? void 0 : node.directives) === null || _a === void 0 ? void 0 : _a.find((dir) => dir.name.value === 'model')); });
    if (!type) {
        throw new Error(`Model "${nodeName}" does not exist.`);
    }
    else {
        const fields = type.fields.map((field) => field.name.value);
        const acm = new graphql_auth_transformer_1.AccessControlMatrix({ name: type.name.value, operations: graphql_auth_transformer_1.MODEL_OPERATIONS, resources: fields });
        const parentAuthDirective = (_a = type.directives) === null || _a === void 0 ? void 0 : _a.find((dir) => dir.name.value === 'auth');
        if (parentAuthDirective) {
            const authRules = (0, graphql_auth_transformer_1.getAuthDirectiveRules)(new graphql_transformer_core_1.DirectiveWrapper(parentAuthDirective), {
                isField: false,
                deepMergeArguments: amplify_cli_core_1.FeatureFlags.getBoolean('graphqltransformer.shouldDeepMergeDirectiveConfigDefaults'),
            });
            convertModelRulesToRoles(acm, authRules);
        }
        for (const fieldNode of type.fields || []) {
            const fieldAuthDir = (_b = fieldNode.directives) === null || _b === void 0 ? void 0 : _b.find((dir) => dir.name.value === 'auth');
            if (fieldAuthDir) {
                if (parentAuthDirective) {
                    acm.resetAccessForResource(fieldNode.name.value);
                }
                const authRules = (0, graphql_auth_transformer_1.getAuthDirectiveRules)(new graphql_transformer_core_1.DirectiveWrapper(fieldAuthDir));
                convertModelRulesToRoles(acm, authRules, fieldNode.name.value);
            }
        }
        const truthTable = acm.getAcmPerRole();
        if (truthTable.size === 0) {
            amplify_prompts_1.printer.warn(`No auth rules have been configured for the "${type.name.value}" model.`);
        }
        for (const [role, acm] of truthTable) {
            console.group(role);
            console.table(acm);
            console.groupEnd();
        }
    }
}
exports.showACM = showACM;
function convertModelRulesToRoles(acm, authRules, field) {
    for (const rule of authRules) {
        const operations = rule.operations || graphql_auth_transformer_1.MODEL_OPERATIONS;
        if (rule.groups && !rule.groupsField) {
            rule.groups.forEach((group) => {
                const roleName = `${rule.provider}:staticGroup:${group}`;
                acm.setRole({ role: roleName, resource: field, operations });
            });
        }
        else {
            let roleName;
            switch (rule.provider) {
                case 'apiKey':
                    roleName = 'apiKey:public';
                    break;
                case 'iam':
                    roleName = `iam:${rule.allow}`;
                    break;
                case 'oidc':
                case 'userPools':
                    if (rule.allow === 'groups') {
                        const groupsField = rule.groupsField || graphql_auth_transformer_1.DEFAULT_GROUPS_FIELD;
                        const groupsClaim = rule.groupClaim || graphql_auth_transformer_1.DEFAULT_GROUP_CLAIM;
                        roleName = `${rule.provider}:dynamicGroup:${groupsClaim}:${groupsField}`;
                    }
                    else if (rule.allow === 'owner') {
                        const ownerField = rule.ownerField || graphql_auth_transformer_1.DEFAULT_OWNER_FIELD;
                        roleName = `${rule.provider}:owner:${ownerField}`;
                    }
                    else if (rule.allow === 'private') {
                        roleName = `${rule.provider}:${rule.allow}`;
                    }
                    else {
                        throw new Error(`Could not create a role from ${JSON.stringify(rule)}`);
                    }
                    break;
                default:
                    throw new Error(`Could not create a role from ${JSON.stringify(rule)}`);
            }
            acm.setRole({ role: roleName, resource: field, operations });
        }
    }
}
//# sourceMappingURL=show-auth-acm.js.map