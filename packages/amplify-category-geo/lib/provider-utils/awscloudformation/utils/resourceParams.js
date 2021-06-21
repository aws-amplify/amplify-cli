"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataProvider = exports.AccessType = exports.PricingPlan = void 0;
var PricingPlan;
(function (PricingPlan) {
    PricingPlan["RequestBasedUsage"] = "RequestBasedUsage";
    PricingPlan["MobileAssetTracking"] = "MobileAssetTracking";
    PricingPlan["MobileAssetManagement"] = "MobileAssetManagement";
})(PricingPlan = exports.PricingPlan || (exports.PricingPlan = {}));
var AccessType;
(function (AccessType) {
    AccessType["AuthorizedUsers"] = "AuthorizedUsers";
    AccessType["AuthorizedAndGuestUsers"] = "AuthorizedAndGuestUsers";
})(AccessType = exports.AccessType || (exports.AccessType = {}));
var DataProvider;
(function (DataProvider) {
    DataProvider["Esri"] = "Esri";
    DataProvider["Here"] = "Here";
})(DataProvider = exports.DataProvider || (exports.DataProvider = {}));
//# sourceMappingURL=resourceParams.js.map