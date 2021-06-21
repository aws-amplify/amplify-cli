"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGeoMapStyle = exports.convertToCompleteMapParams = exports.isCompleteMapParams = exports.HereMapStyleType = exports.EsriMapStyleType = void 0;
const lodash_1 = __importDefault(require("lodash"));
var EsriMapStyleType;
(function (EsriMapStyleType) {
    EsriMapStyleType["Navigation"] = "Navigation";
    EsriMapStyleType["Streets"] = "Streets";
    EsriMapStyleType["Topographic"] = "Topographic";
    EsriMapStyleType["Canvas"] = "Canvas";
})(EsriMapStyleType = exports.EsriMapStyleType || (exports.EsriMapStyleType = {}));
var HereMapStyleType;
(function (HereMapStyleType) {
    HereMapStyleType["Berlin"] = "Berlin";
})(HereMapStyleType = exports.HereMapStyleType || (exports.HereMapStyleType = {}));
function isCompleteMapParams(partial) {
    const requiredFields = ['providerContext', 'mapName', 'mapStyleType', 'dataProvider', 'accessType', 'isDefaultMap'];
    const missingField = requiredFields.find(field => !lodash_1.default.keys(partial).includes(field));
    return !missingField;
}
exports.isCompleteMapParams = isCompleteMapParams;
function convertToCompleteMapParams(partial) {
    if (isCompleteMapParams(partial)) {
        return partial;
    }
    throw new Error('Partial<MapParameters> does not satisfy MapParameters');
}
exports.convertToCompleteMapParams = convertToCompleteMapParams;
function getGeoMapStyle(dataProvider, mapStyleType) {
    return `Vector${dataProvider}${mapStyleType}`;
}
exports.getGeoMapStyle = getGeoMapStyle;
//# sourceMappingURL=mapParams.js.map