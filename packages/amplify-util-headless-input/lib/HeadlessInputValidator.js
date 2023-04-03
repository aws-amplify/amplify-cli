"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeadlessInputValidator = void 0;
const ajv_1 = __importDefault(require("ajv"));
class HeadlessInputValidator {
    constructor(schemaSupplier, versionUpgradePipeline) {
        this.schemaSupplier = schemaSupplier;
        this.versionUpgradePipeline = versionUpgradePipeline;
    }
    async validate(raw) {
        const data = JSON.parse(raw);
        const version = await this.checkAgainstSchema(data);
        return this.upgradeInput(data, version);
    }
    async checkAgainstSchema(data) {
        if (!data || !data.version || typeof data.version !== 'number') {
            throw new Error('data does not have a top level "version" field');
        }
        const version = data.version;
        const schema = await this.schemaSupplier(version);
        if (!schema) {
            throw new Error(`No schema found for version ${version}`);
        }
        const ajv = new ajv_1.default();
        if (schema.dependencySchemas) {
            schema.dependencySchemas.reduce((acc, it) => acc.addSchema(it), ajv);
        }
        const validator = ajv.compile(schema.rootSchema);
        if (!validator(data)) {
            throw new Error(`Data did not validate against the supplied schema. Underlying errors were ${JSON.stringify(validator.errors)}`);
        }
        return version;
    }
    upgradeInput(data, version) {
        return this.versionUpgradePipeline(version).reduce((output, transform) => transform(output), data);
    }
}
exports.HeadlessInputValidator = HeadlessInputValidator;
//# sourceMappingURL=HeadlessInputValidator.js.map