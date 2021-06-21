"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiDocs = exports.ServiceName = exports.provider = exports.parametersFileName = exports.chooseServiceMessageUpdate = exports.chooseServiceMessageAdd = void 0;
exports.chooseServiceMessageAdd = 'Select which capability you want to add:';
exports.chooseServiceMessageUpdate = 'Select which capability you want to update:';
exports.parametersFileName = 'parameters.json';
exports.provider = 'awscloudformation';
var ServiceName;
(function (ServiceName) {
    ServiceName["Map"] = "Map";
    ServiceName["PlaceIndex"] = "PlaceIndex";
    ServiceName["GeofenceCollection"] = "GeofenceCollection";
    ServiceName["Tracker"] = "Tracker";
})(ServiceName = exports.ServiceName || (exports.ServiceName = {}));
exports.apiDocs = {
    mapStyles: "https://docs.aws.amazon.com/location-maps/latest/APIReference/API_MapConfiguration.html",
    pricingPlan: "https://aws.amazon.com/location/pricing/"
};
//# sourceMappingURL=constants.js.map