"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMigrateResourceMessageForOverride = void 0;
const chalk_1 = __importDefault(require("chalk"));
const os_1 = require("os");
function getMigrateResourceMessageForOverride(categoryName, resourceName, isUpdate = true) {
    const docsLink = 'https://docs.amplify.aws/cli/migration/override';
    if (isUpdate) {
        return [
            '',
            `A migration is needed to support latest updates on ${categoryName} resources.`,
            chalk_1.default.red(`Recommended to try in a non-production environment first. Run "amplify env add" to create or clone an environment.`),
            chalk_1.default.red(`Custom CloudFormation changes will NOT be preserved. Custom changes can be made with "amplify ${categoryName} override" after migration.`),
            `Learn more about this migration: ${docsLink}`,
            `Do you want to migrate ${categoryName} resource "${resourceName}"?`,
        ].join(os_1.EOL);
    }
    return [
        '',
        `A migration is needed to override ${categoryName} resources.`,
        chalk_1.default.red(`Recommended to try in a non-production environment first. Run "amplify env add" to create or clone an environment.`),
        chalk_1.default.red(`Custom CloudFormation changes will NOT be preserved, but they can be reintroduced in the override.ts file.`),
        `Learn more about this migration: ${docsLink}`,
        `Do you want to migrate ${categoryName} resource "${resourceName}" to support overrides?`,
    ].join(os_1.EOL);
}
exports.getMigrateResourceMessageForOverride = getMigrateResourceMessageForOverride;
//# sourceMappingURL=migration-message.js.map