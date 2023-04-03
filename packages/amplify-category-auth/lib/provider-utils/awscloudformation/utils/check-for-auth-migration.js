"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAuthResourceMigration = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const auth_input_state_1 = require("../auth-inputs-manager/auth-input-state");
const generate_auth_stack_template_1 = require("./generate-auth-stack-template");
const migrate_override_resource_1 = require("./migrate-override-resource");
const checkAuthResourceMigration = async (context, authName, isUpdate) => {
    var _a, _b, _c;
    const { imported } = context.amplify.getImportedAuthProperties(context);
    if (!imported) {
        const cliState = new auth_input_state_1.AuthInputState(context, authName);
        if (!cliState.cliInputFileExists()) {
            amplify_prompts_1.printer.debug("cli-inputs.json doesn't exist");
            const headlessMigrate = ((_a = context.input.options) === null || _a === void 0 ? void 0 : _a.yes) || ((_b = context.input.options) === null || _b === void 0 ? void 0 : _b.forcePush) || ((_c = context.input.options) === null || _c === void 0 ? void 0 : _c.headless);
            if (headlessMigrate ||
                (await amplify_prompts_1.prompter.yesOrNo((0, amplify_cli_core_1.getMigrateResourceMessageForOverride)(amplify_cli_core_1.AmplifyCategories.AUTH, authName, isUpdate), true))) {
                await (0, migrate_override_resource_1.migrateResourceToSupportOverride)(authName);
                const cliInputs = cliState.getCLIInputPayload();
                await (0, generate_auth_stack_template_1.generateAuthStackTemplate)(context, cliInputs.cognitoConfig.resourceName);
                return true;
            }
            return false;
        }
    }
    return true;
};
exports.checkAuthResourceMigration = checkAuthResourceMigration;
//# sourceMappingURL=check-for-auth-migration.js.map