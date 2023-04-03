"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchPermissionsForResourceInCategory = exports.fetchPermissionResourcesForCategory = exports.fetchPermissionCategories = void 0;
const lodash_1 = __importDefault(require("lodash"));
const fetchPermissionCategories = (permissionMap) => {
    return lodash_1.default.keys(permissionMap);
};
exports.fetchPermissionCategories = fetchPermissionCategories;
const fetchPermissionResourcesForCategory = (permissionMap, category) => {
    return lodash_1.default.keys(lodash_1.default.get(permissionMap, [category]));
};
exports.fetchPermissionResourcesForCategory = fetchPermissionResourcesForCategory;
const fetchPermissionsForResourceInCategory = (permissionMap = {}, category, resourceName) => {
    return lodash_1.default.get(permissionMap, [category, resourceName]);
};
exports.fetchPermissionsForResourceInCategory = fetchPermissionsForResourceInCategory;
//# sourceMappingURL=permissionMapUtils.js.map