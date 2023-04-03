"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultLayerPermission = exports.PermissionEnum = void 0;
var PermissionEnum;
(function (PermissionEnum) {
    PermissionEnum["Private"] = "Private";
    PermissionEnum["Public"] = "Public";
    PermissionEnum["AwsAccounts"] = "AwsAccounts";
    PermissionEnum["AwsOrg"] = "AwsOrg";
})(PermissionEnum = exports.PermissionEnum || (exports.PermissionEnum = {}));
exports.defaultLayerPermission = { type: PermissionEnum.Private };
//# sourceMappingURL=layerParams.js.map