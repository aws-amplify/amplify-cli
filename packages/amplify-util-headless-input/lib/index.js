"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUpdateGeoRequest = exports.validateAddGeoRequest = exports.validateUpdateStorageRequest = exports.validateRemoveStorageRequest = exports.validateImportStorageRequest = exports.validateAddStorageRequest = exports.validateImportAuthRequest = exports.validateUpdateAuthRequest = exports.validateAddAuthRequest = exports.validateUpdateApiRequest = exports.validateAddApiRequest = void 0;
const HeadlessInputValidator_1 = require("./HeadlessInputValidator");
const schemaSuppliers_1 = require("./schemaSuppliers");
const upgradePipelines_1 = require("./upgradePipelines");
const validateAddApiRequest = (raw) => {
    return new HeadlessInputValidator_1.HeadlessInputValidator(schemaSuppliers_1.addApiRequestSchemaSupplier, upgradePipelines_1.noopUpgradePipeline).validate(raw);
};
exports.validateAddApiRequest = validateAddApiRequest;
const validateUpdateApiRequest = (raw) => {
    return new HeadlessInputValidator_1.HeadlessInputValidator(schemaSuppliers_1.updateApiRequestSchemaSupplier, upgradePipelines_1.noopUpgradePipeline).validate(raw);
};
exports.validateUpdateApiRequest = validateUpdateApiRequest;
const validateAddAuthRequest = (raw) => {
    return new HeadlessInputValidator_1.HeadlessInputValidator(schemaSuppliers_1.addAuthRequestSchemaSupplier, upgradePipelines_1.authUpgradePipeline).validate(raw);
};
exports.validateAddAuthRequest = validateAddAuthRequest;
const validateUpdateAuthRequest = (raw) => {
    return new HeadlessInputValidator_1.HeadlessInputValidator(schemaSuppliers_1.updateAuthRequestSchemaSupplier, upgradePipelines_1.authUpgradePipeline).validate(raw);
};
exports.validateUpdateAuthRequest = validateUpdateAuthRequest;
const validateImportAuthRequest = (raw) => {
    return new HeadlessInputValidator_1.HeadlessInputValidator(schemaSuppliers_1.importAuthRequestSchemaSupplier, upgradePipelines_1.noopUpgradePipeline).validate(raw);
};
exports.validateImportAuthRequest = validateImportAuthRequest;
const validateAddStorageRequest = (raw) => {
    return new HeadlessInputValidator_1.HeadlessInputValidator(schemaSuppliers_1.addStorageRequestSchemaSupplier, upgradePipelines_1.noopUpgradePipeline).validate(raw);
};
exports.validateAddStorageRequest = validateAddStorageRequest;
const validateImportStorageRequest = (raw) => {
    return new HeadlessInputValidator_1.HeadlessInputValidator(schemaSuppliers_1.importStorageRequestSchemaSupplier, upgradePipelines_1.noopUpgradePipeline).validate(raw);
};
exports.validateImportStorageRequest = validateImportStorageRequest;
const validateRemoveStorageRequest = (raw) => {
    return new HeadlessInputValidator_1.HeadlessInputValidator(schemaSuppliers_1.removeStorageRequestSchemaSupplier, upgradePipelines_1.noopUpgradePipeline).validate(raw);
};
exports.validateRemoveStorageRequest = validateRemoveStorageRequest;
const validateUpdateStorageRequest = (raw) => {
    return new HeadlessInputValidator_1.HeadlessInputValidator(schemaSuppliers_1.updateStorageRequestSchemaSupplier, upgradePipelines_1.noopUpgradePipeline).validate(raw);
};
exports.validateUpdateStorageRequest = validateUpdateStorageRequest;
const validateAddGeoRequest = (raw) => {
    return new HeadlessInputValidator_1.HeadlessInputValidator(schemaSuppliers_1.addGeoRequestSchemaSupplier, upgradePipelines_1.noopUpgradePipeline).validate(raw);
};
exports.validateAddGeoRequest = validateAddGeoRequest;
const validateUpdateGeoRequest = (raw) => {
    return new HeadlessInputValidator_1.HeadlessInputValidator(schemaSuppliers_1.updateGeoRequestSchemaSupplier, upgradePipelines_1.noopUpgradePipeline).validate(raw);
};
exports.validateUpdateGeoRequest = validateUpdateGeoRequest;
//# sourceMappingURL=index.js.map