"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertToCompleteGeofenceCollectionParams = exports.isCompleteGeofenceCollectionParams = void 0;
const lodash_1 = __importDefault(require("lodash"));
const isCompleteGeofenceCollectionParams = (partial) => {
    const requiredFields = ['providerContext', 'name', 'accessType', 'isDefault'];
    const missingField = requiredFields.find((field) => !lodash_1.default.keys(partial).includes(field));
    return !missingField;
};
exports.isCompleteGeofenceCollectionParams = isCompleteGeofenceCollectionParams;
const convertToCompleteGeofenceCollectionParams = (partial) => {
    if ((0, exports.isCompleteGeofenceCollectionParams)(partial)) {
        return partial;
    }
    throw new Error('Partial<GeofenceCollectionParameters> does not satisfy GeofenceCollectionParameters');
};
exports.convertToCompleteGeofenceCollectionParams = convertToCompleteGeofenceCollectionParams;
//# sourceMappingURL=geofenceCollectionParams.js.map