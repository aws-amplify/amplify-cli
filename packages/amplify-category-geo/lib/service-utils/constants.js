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
exports.ServiceName = exports.customGeofenceCollectionLambdaCodePath = exports.customPlaceIndexLambdaCodePath = exports.customMapLambdaCodePath = exports.provider = exports.parametersFileName = exports.chooseServiceMessageRemove = exports.chooseServiceMessageUpdate = exports.chooseServiceMessageAdd = exports.previewBanner = exports.apiDocs = void 0;
const path = __importStar(require("path"));
exports.apiDocs = {
    mapStyles: 'https://docs.aws.amazon.com/location-maps/latest/APIReference/API_MapConfiguration.html',
    pricingPlan: 'https://aws.amazon.com/location/pricing/',
    dataSourceUsage: 'https://docs.aws.amazon.com/location-places/latest/APIReference/API_DataSourceConfiguration.html',
    locationServiceTerms: 'https://aws.amazon.com/service-terms/',
};
exports.previewBanner = 'Amplify Geo category is in developer preview and not intended for production use at this time.';
exports.chooseServiceMessageAdd = 'Select which capability you want to add:';
exports.chooseServiceMessageUpdate = 'Select which capability you want to update:';
exports.chooseServiceMessageRemove = 'Select which capability you want to remove:';
exports.parametersFileName = 'parameters.json';
exports.provider = 'awscloudformation';
exports.customMapLambdaCodePath = path.join(__dirname, '../../resources/custom-map-resource-handler.js');
exports.customPlaceIndexLambdaCodePath = path.join(__dirname, '../../resources/custom-place-index-resource-handler.js');
exports.customGeofenceCollectionLambdaCodePath = path.join(__dirname, '../../resources/custom-geofence-collection-resource-handler.js');
var ServiceName;
(function (ServiceName) {
    ServiceName["Map"] = "Map";
    ServiceName["PlaceIndex"] = "PlaceIndex";
    ServiceName["GeofenceCollection"] = "GeofenceCollection";
    ServiceName["Tracker"] = "Tracker";
})(ServiceName = exports.ServiceName || (exports.ServiceName = {}));
//# sourceMappingURL=constants.js.map