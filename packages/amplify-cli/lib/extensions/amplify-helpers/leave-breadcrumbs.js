"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
exports.leaveBreadcrumbs = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const path = __importStar(require("path"));
const constants_1 = require("./constants");
function leaveBreadcrumbs(category, resourceName, breadcrumbs) {
    const destPath = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), category, resourceName, constants_1.amplifyCLIConstants.BreadcrumbsFileName);
    amplify_cli_core_1.JSONUtilities.writeJson(destPath, breadcrumbs);
}
exports.leaveBreadcrumbs = leaveBreadcrumbs;
//# sourceMappingURL=leave-breadcrumbs.js.map