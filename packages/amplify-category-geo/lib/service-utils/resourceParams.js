"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataProvider = exports.AccessType = void 0;
var AccessType;
(function (AccessType) {
    AccessType["AuthorizedUsers"] = "AuthorizedUsers";
    AccessType["AuthorizedAndGuestUsers"] = "AuthorizedAndGuestUsers";
    AccessType["CognitoGroups"] = "CognitoGroups";
})(AccessType = exports.AccessType || (exports.AccessType = {}));
var DataProvider;
(function (DataProvider) {
    DataProvider["Esri"] = "Esri";
    DataProvider["Here"] = "HERE";
    DataProvider["OpenData"] = "OpenData";
})(DataProvider = exports.DataProvider || (exports.DataProvider = {}));
//# sourceMappingURL=resourceParams.js.map