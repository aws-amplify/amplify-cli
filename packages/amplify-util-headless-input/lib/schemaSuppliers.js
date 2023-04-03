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
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateGeoRequestSchemaSupplier = exports.addGeoRequestSchemaSupplier = exports.updateApiRequestSchemaSupplier = exports.addApiRequestSchemaSupplier = exports.importAuthRequestSchemaSupplier = exports.updateAuthRequestSchemaSupplier = exports.addAuthRequestSchemaSupplier = exports.removeStorageRequestSchemaSupplier = exports.importStorageRequestSchemaSupplier = exports.updateStorageRequestSchemaSupplier = exports.addStorageRequestSchemaSupplier = void 0;
const addStorageRequestSchemaSupplier = (version) => {
    return getSchema('AddStorageRequest', 'storage', version);
};
exports.addStorageRequestSchemaSupplier = addStorageRequestSchemaSupplier;
const updateStorageRequestSchemaSupplier = (version) => {
    return getSchema('UpdateStorageRequest', 'storage', version);
};
exports.updateStorageRequestSchemaSupplier = updateStorageRequestSchemaSupplier;
const importStorageRequestSchemaSupplier = (version) => {
    return getSchema('ImportStorageRequest', 'storage', version);
};
exports.importStorageRequestSchemaSupplier = importStorageRequestSchemaSupplier;
const removeStorageRequestSchemaSupplier = (version) => {
    return getSchema('RemoveStorageRequest', 'storage', version);
};
exports.removeStorageRequestSchemaSupplier = removeStorageRequestSchemaSupplier;
const addAuthRequestSchemaSupplier = (version) => {
    return getSchema('AddAuthRequest', 'auth', version);
};
exports.addAuthRequestSchemaSupplier = addAuthRequestSchemaSupplier;
const updateAuthRequestSchemaSupplier = (version) => {
    return getSchema('UpdateAuthRequest', 'auth', version);
};
exports.updateAuthRequestSchemaSupplier = updateAuthRequestSchemaSupplier;
const importAuthRequestSchemaSupplier = (version) => {
    return getSchema('ImportAuthRequest', 'auth', version);
};
exports.importAuthRequestSchemaSupplier = importAuthRequestSchemaSupplier;
const addApiRequestSchemaSupplier = (version) => {
    return getSchema('AddApiRequest', 'api', version);
};
exports.addApiRequestSchemaSupplier = addApiRequestSchemaSupplier;
const updateApiRequestSchemaSupplier = (version) => {
    return getSchema('UpdateApiRequest', 'api', version);
};
exports.updateApiRequestSchemaSupplier = updateApiRequestSchemaSupplier;
const addGeoRequestSchemaSupplier = (version) => {
    return getSchema('AddGeoRequest', 'geo', version);
};
exports.addGeoRequestSchemaSupplier = addGeoRequestSchemaSupplier;
const updateGeoRequestSchemaSupplier = (version) => {
    return getSchema('UpdateGeoRequest', 'geo', version);
};
exports.updateGeoRequestSchemaSupplier = updateGeoRequestSchemaSupplier;
const getSchema = async (type, category, version) => {
    var _a;
    try {
        return {
            rootSchema: await (_a = `amplify-headless-interface/schemas/${category}/${version}/${type}.schema.json`, Promise.resolve().then(() => __importStar(require(_a)))),
        };
    }
    catch (ex) {
        return undefined;
    }
};
//# sourceMappingURL=schemaSuppliers.js.map