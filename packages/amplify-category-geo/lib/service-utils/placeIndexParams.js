"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertToCompletePlaceIndexParams = exports.isCompletePlaceIndexParams = exports.DataSourceIntendedUse = void 0;
const lodash_1 = __importDefault(require("lodash"));
var DataSourceIntendedUse;
(function (DataSourceIntendedUse) {
    DataSourceIntendedUse["SingleUse"] = "SingleUse";
    DataSourceIntendedUse["Storage"] = "Storage";
})(DataSourceIntendedUse = exports.DataSourceIntendedUse || (exports.DataSourceIntendedUse = {}));
const isCompletePlaceIndexParams = (partial) => {
    const requiredFields = ['providerContext', 'name', 'dataSourceIntendedUse', 'dataProvider', 'accessType', 'isDefault'];
    const missingField = requiredFields.find((field) => !lodash_1.default.keys(partial).includes(field));
    return !missingField;
};
exports.isCompletePlaceIndexParams = isCompletePlaceIndexParams;
const convertToCompletePlaceIndexParams = (partial) => {
    if ((0, exports.isCompletePlaceIndexParams)(partial)) {
        return partial;
    }
    throw new Error('Partial<PlaceIndexParameters> does not satisfy PlaceIndexParameters');
};
exports.convertToCompletePlaceIndexParams = convertToCompletePlaceIndexParams;
//# sourceMappingURL=placeIndexParams.js.map